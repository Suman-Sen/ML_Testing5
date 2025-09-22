import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import asyncHandler from "express-async-handler";
import chunkArray from "../utils/chunkArray";
import { socketsById } from "../sockets/websocket";

const router = Router();
const upload = multer({ dest: "uploads/" });
const IMAGE_CLASSIFY_URL = "http://localhost:6000";
router.post(
  "/image",
  upload.array("images"),
  asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.query.id);
    const scanType = "classify";
    const clientWs = socketsById.get(id);
    const files = req.files as Express.Multer.File[];

    if (!files?.length) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    if (!clientWs || clientWs.readyState !== clientWs.OPEN) {
      res.status(400).json({ error: "WebSocket not available or not open" });
      return;
    }
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
              metadata: response.data.metadata || {},
            };
          } catch {
            return {
              filename: file.originalname,
              label: "Error",
              metadata: {},
            };
          } finally {
            fs.unlinkSync(file.path);
          }
        })
      );

      if (clientWs?.readyState === clientWs.OPEN) {
        clientWs.send(
          JSON.stringify({ requestId: id, type: scanType, batch: results })
        );
      }
    }

    if (clientWs?.readyState === clientWs.OPEN) {
      clientWs.send(
        JSON.stringify({ requestId: id, type: scanType, done: true })
      );
    }

    res.status(200).json({ status: "Uploaded" });
  })
);

export default router;
