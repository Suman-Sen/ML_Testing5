import { Request, Response, Router } from "express";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";

import asyncHandler from "express-async-handler";
import { socketsById } from "../sockets/websocket";
import axios from "axios";
// import { error } from "console";

const DOCUMENT_SCAN_URL: string = "http://localhost:5003";
const router = Router();
const upload = multer({ dest: "uploads/" });

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
    }

    const form = new FormData();

    files.forEach((file) => {
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
        { headers: form.getHeaders(), timeout: 30000 }
      );
      files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
      if (clientWS?.readyState === clientWS.OPEN) {
        clientWS.send(
          JSON.stringify({
            requestId,
            type: "document-pii",
            batch: response.data,
          })
        );
      }
      clientWS.send(
        JSON.stringify({ requestId, type: "document-pii", done: true })
      );
      res.status(200).json({ status: "PII scan complete" });
      return;
    } catch (error) {
      if (clientWS?.readyState === clientWS.OPEN) {
        clientWS.send(
          JSON.stringify({
            requestId,
            type: "document-pii",
            error: "Failed to analyze the document for PII",
            done: true,
          })
        );
        return;
      }
    }

    res
      .status(500)
      .json({ error: "Failed to analyze the documents for PII scans" });
    return;
  })
);

export default router;
