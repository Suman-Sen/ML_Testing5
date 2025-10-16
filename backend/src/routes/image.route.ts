import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import asyncHandler from "express-async-handler";
import chunkArray from "../utils/chunkArray";
import { socketsById } from "../sockets/websocket";
import { PrismaClient } from "../../prisma/generated/prisma";

const router = Router();
const upload = multer({ dest: "uploads/" });
const prisma = new PrismaClient();
const IMAGE_CLASSIFY_URL = "http://localhost:6000";

// Helper to map ML labels to Prisma enum values
function mapToImageLabel(label: string): "AADHAAR" | "PAN" | "PASSPORT" {
  const normalized = label.toLowerCase();
  if (normalized.includes("aadhaar")) return "AADHAAR";
  if (normalized.includes("pan")) return "PAN";
  if (normalized.includes("passport")) return "PASSPORT";
  return "PAN"; // fallback or throw error if needed
}

router.post(
  "/image",
  upload.array("images"),
  asyncHandler(async (req: Request, res: Response) => {

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

    const userId = user.id; // static user ID for now
    const scanType = "classify";
    const clientWs = socketsById.get(userId);
    const files = req.files as Express.Multer.File[];

    if (!files?.length) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    if (!clientWs || clientWs.readyState !== clientWs.OPEN) {
      res.status(400).json({ error: "WebSocket not available or not open" });
      return;
    }

    // Create a new Batch record
    const batchRecord = await prisma.batch.create({
      data: {
        scanType: "IMAGE_SCAN",
        creatorId: userId,
        totalNumFiles: files.length,
      },
    });

    const batches = chunkArray(files, 5);
    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (file) => {
          const form = new FormData();
          form.append(
            "image",
            fs.createReadStream(file.path),
            file.originalname
          );

          try {
            const response = await axios.post(
              `${IMAGE_CLASSIFY_URL}/predict`,
              form,
              {
                headers: form.getHeaders(),
                timeout: 20000,
              }
            );

            return {
              filename: file.originalname,
              label: response.data.label,
              confidence:
                typeof response.data.confidence === "string"
                  ? parseFloat(response.data.confidence.replace("%", ""))
                  : response.data.confidence ?? 0,
              metadata: response.data.metadata || {},
            };
          } catch {
            return {
              filename: file.originalname,
              label: "Error",
              confidence: 0,
              metadata: {},
            };
          } finally {
            fs.unlinkSync(file.path);
          }
        })
      );

      // Store results in ImageResult table
      await prisma.imageResult.createMany({
        data: results.map((result) => ({
          fileName: result.filename,
          label: mapToImageLabel(result.label),
          confidence: result.confidence,
          batchId: batchRecord.id,
        })),
      });

      // Send results to WebSocket client
      if (clientWs?.readyState === clientWs.OPEN) {
        clientWs.send(
          JSON.stringify({ requestId: userId, type: scanType, batch: results })
        );
      }
    }

    if (clientWs?.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({ requestId: userId, type: scanType, done: true })
      );
    }

    res.status(200).json({ status: "Uploaded and stored" });
  })
);

export default router;
