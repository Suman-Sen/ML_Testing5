import { Request, Response, Router } from "express";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import asyncHandler from "express-async-handler";
import { socketsById } from "../sockets/websocket";
import axios from "axios";
import { PrismaClient } from "../../prisma/generated/prisma";
import chunkArray from "../utils/chunkArray";

const DOCUMENT_SCAN_URL = "http://localhost:5003";
const router = Router();
const upload = multer({ dest: "uploads/" });
const prisma = new PrismaClient();

router.post(
  "/document-pii",
  upload.array("files"),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = String(req.query.id);
    const clientWS = socketsById.get(requestId);
    const files = req.files as Express.Multer.File[];
    const piiTypes = req.body.pii_types;

    if (!clientWS || clientWS.readyState !== clientWS.OPEN) {
      res
        .status(400)
        .json({ error: "WebSocket is either unavailable or is not open" });
      return;
    }

    if (!files?.length) {
      res.status(400).json({ error: "No files were uploaded to be scanned" });
      return;
    }

    // TODO: Delete it after users are built
    const user = await prisma.user.upsert({
      where: { email: "johndoe@example.com" },
      update: {},
      create: {
        email: "johndoe@example.com",
        role: "SCANNER",
        firstName: "Seeded",
        lastName: "User",
      },
    });

    const batch = await prisma.batch.create({
      data: {
        scanType: "DOCUMENT_SCAN",
        creatorId: user.id,
        totalNumFiles: files.length,
      },
    });

    const fileChunks = chunkArray(files, 5);

    for (const chunk of fileChunks) {
      const form = new FormData();
      chunk.forEach((file) => {
        form.append("files", fs.createReadStream(file.path), file.originalname);
      });

      if (piiTypes) {
        (Array.isArray(piiTypes) ? piiTypes : [piiTypes]).forEach((type) =>
          form.append("pii_types", type)
        );
      }

      try {
        const response = await axios.post(
          `${DOCUMENT_SCAN_URL}/document-upload`,
          form,
          {
            headers: form.getHeaders(),
            timeout: 30000,
          }
        );

        chunk.forEach((file) => fs.unlinkSync(file.path));

        for (const result of response.data) {
          await prisma.documentResult.create({
            data: {
              fileName: result.file_name,
              fileType: result.file_name.split(".").pop(),
              piiFound: result.pii_found,
              batch: { connect: { id: batch.id } },
              classifications: {
                create: Object.entries(result.classifications).map(
                  ([piiType, count]) => ({
                    piiType,
                    count: Number(count),
                  })
                ),
              },
            },
          });
        }

        if (clientWS?.readyState === clientWS.OPEN) {
          clientWS.send(
            JSON.stringify({
              requestId,
              type: "document-pii",
              batch: response.data,
            })
          );
        }
      } catch (error) {
        console.error("Batch scan failed:", error);
        if (clientWS?.readyState === clientWS.OPEN) {
          clientWS.send(
            JSON.stringify({
              requestId,
              type: "document-pii",
              error: "Failed to analyze a batch of documents",
            })
          );
        }
      }
    }

    if (clientWS?.readyState === clientWS.OPEN) {
      clientWS.send(
        JSON.stringify({ requestId, type: "document-pii", done: true })
      );
    }

    res.status(200).json({ status: "PII scan complete", batchId: batch.id });
  })
);

export default router;
