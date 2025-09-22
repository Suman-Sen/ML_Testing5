import axios from "axios";
import { error } from "console";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import fs from "fs";

const DB_scan_URL = "http://localhost:5000";
const router = Router();

type payload = {
  conn_string: string;
  db_type: string;
  pii_types?: string | string[];
};

router.post(
  "/db-pii",
  asyncHandler(async (req: Request, res: Response) => {
    const { conn_string, scan_type, table_name, pii_types, db_type } = req.body;
    const payload: payload = { conn_string, db_type };
    let endpoint: string = "";

    switch (scan_type) {
      case "pii-meta":
        endpoint = "/metadata-classify";
        break;
      case "pii-full":
        endpoint = "/full-pii-scan";
        payload.pii_types = pii_types;
        break;
      case "pii-table":
        endpoint = "/table-pii-scan";
        payload.pii_types = pii_types;
        break;
      default:
        res.status(400).json({ error: "Invalid pii scan type" });
        return;
    }
    try {
      const results = await axios.post(`${DB_scan_URL}${endpoint}`, payload);
      res.json({ data: results.data });
    } catch (error) {
      res.status(500).json({ error: "Failed ti query the DB scan server" });
    }
  })
);

export default router;
