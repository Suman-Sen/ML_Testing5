import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';

const app = express();
const port = 5000;
const upload = multer({ dest: 'uploads/' });

app.use(cors());

// Types
interface MetadataResult {
  filename: string;
  inferred_label: string;
  metadata: Record<string, any>;
}

interface ClassifyResult {
  filename: string;
  label: string;
  metadata: Record<string, any>;
}

//Middleware for error wrapping
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

//Routes

app.post(
  '/metadata',
  upload.array('images'),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const results: MetadataResult[] = [];

    for (const file of files) {
      const form = new FormData();
      form.append('image', fs.createReadStream(file.path), file.originalname);

      try {
        const response = await axios.post('http://localhost:6000/metadata', form, {
          headers: form.getHeaders(),
          // timeout: 10000, // optional: timeout in ms
        });

        results.push({
          filename: file.originalname,
          inferred_label: response.data.file_based || 'Unknown',
          metadata: response.data.metadata || {},
        });
      } catch (err: any) {
        console.error(`Metadata error for file ${file.originalname}:`, err.message);
        results.push({
          filename: file.originalname,
          inferred_label: 'Error',
          metadata: {},
        });
      } finally {
        // Cleanup temp file safely
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupErr) {
          console.warn(`Failed to delete temp file ${file.path}:`, cleanupErr);
        }
      }
    }

    res.json({ results });
  })
);

app.post(
  '/classify',
  upload.array('images'),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const results: ClassifyResult[] = [];

    for (const file of files) {
      const form = new FormData();
      form.append('image', fs.createReadStream(file.path), file.originalname);

      try {
        const response = await axios.post('http://localhost:6000/predict', form, {
          headers: form.getHeaders(),
          timeout: 10000,
        });

        results.push({
          filename: file.originalname,
          label: response.data.label || 'Unknown',
          metadata: response.data.metadata || {},
        });
      } catch (err: any) {
        console.error(`Classification error for file ${file.originalname}:`, err.message);
        results.push({
          filename: file.originalname,
          label: 'Error',
          metadata: {},
        });
      } finally {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupErr) {
          console.warn(`Failed to delete temp file ${file.path}:`, cleanupErr);
        }
      }
    }

    res.json({ results });
  })
);

//Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Express server running at http://localhost:${port}`);
});
