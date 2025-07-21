import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import asyncHandler from 'express-async-handler';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 3000;
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Interfaces
interface ClientMessage {
    id: string;
    type: 'classify' | 'metadata' | 'document-pii';
}

interface ClassifyResult {
    filename: string;
    label: string;
    metadata: Record<string, any>;
}

interface MetadataResult {
    filename: string;
    inferred_label: string;
    metadata: Record<string, any>;
}

// Helpers
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

// =============================================================================
// ================================================================
/*=================================
Just installing the asyncHeader 
imports works fine no need to 
write it
=================================*/
// function asyncHandler(
//     fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
// ): express.RequestHandler {
//     return (req, res, next) => {
//         fn(req, res, next).catch(next);
//     };
// }
// ================================================================
// =============================================================================


// WebSocket connection map
const socketsById = new Map<string, WebSocket>();   
// WebSocket setup
wss.on('connection', (ws) => {
    let currentId = '';

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message.toString()) as ClientMessage;
            currentId = parsed.id;
            socketsById.set(parsed.id, ws);
        } catch (e) {
            console.error('Invalid WebSocket message:', message);
        }
    });

    ws.on('close', () => {
        if (currentId) {
            socketsById.delete(currentId);
        }
    });
});

// Upload route for image classification/metadata
app.post(
    '/upload',
    upload.array('images'),
    asyncHandler(async (req: Request, res: Response) => {
        const id = String(req.query.id);
        const scanType = String(req.query.type) as 'classify' | 'metadata';
        const clientWs = socketsById.get(id) || null;

        const files = req.files as Express.Multer.File[] | undefined;

        if (!files || files.length === 0) {
            console.error('No files uploaded.');
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        const batches = chunkArray(files, 5);
        for (const batch of batches) {
            const results = await Promise.all(
                batch.map(async (file) => {
                    const form = new FormData();
                    form.append('image', fs.createReadStream(file.path), file.originalname);
                    const url =
                        scanType === 'classify'
                            ? 'http://localhost:6000/predict'
                            : 'http://localhost:6000/metadata';

                    try {
                        const response = await axios.post(url, form, {
                            headers: form.getHeaders(),
                            timeout: 20000,
                        });
                        if (scanType === 'classify') {
                            return {
                                filename: file.originalname,
                                label: response.data.label,
                                metadata: response.data.metadata || {},
                            } as ClassifyResult;
                        } else {
                            return {
                                filename: file.originalname,
                                inferred_label: response.data.file_based,
                                metadata: response.data.metadata || {},
                            } as MetadataResult;
                        }
                    } catch {
                        return scanType === 'classify'
                            ? { filename: file.originalname, label: 'Error', metadata: {} }
                            : { filename: file.originalname, inferred_label: 'Error', metadata: {} };
                    } finally {
                        try {
                            fs.unlinkSync(file.path);
                        } catch { }
                    }
                })
            );

            if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                    JSON.stringify({
                        requestId: id,
                        type: scanType,
                        batch: results,
                    })
                );
            }
        }

        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ requestId: id, type: scanType, done: true }));
        }

        res.status(200).json({ status: 'Uploaded' });
    })
);

// DB PII bridge route
app.post(
    '/db-pii',
    asyncHandler(async (req: Request, res: Response) => {
        const { conn_string, type, table } = req.body;
        let endpoint = '';
        const payload: any = { conn_string };

        switch (type) {
            case 'pii-meta':
                endpoint = '/metadata-classify';
                break;
            case 'pii-full':
                endpoint = '/full-pii-scan';
                break;
            case 'pii-table':
                endpoint = '/table-pii-scan';
                payload.table_name = table;
                break;
            default:
                res.status(400).json({ error: 'Invalid PII scan type' });
                return;
        }

        try {
            const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
            res.json({ data: response.data });
        } catch (err: any) {
            console.error('PII Bridge Error:', err.message);
            console.error('Axios Error Code:', err.code);
            console.error('Axios Full Error:', err.toJSON?.() || err);
            console.error('Flask Response (if any):', err?.response?.data);
            res.status(500).json({ error: 'Failed to query Flask PII service' });
        }
    })
);

// Document PII route with WebSocket support
// app.post(
//     '/document-pii',
//     upload.array('files'),
//     asyncHandler(async (req: Request, res: Response) => {
//         const requestId = String(req.query.id);
//         const clientWs = socketsById.get(requestId) || null;

//         const files = req.files as Express.Multer.File[] | undefined;

//         if (!files || files.length === 0) {
//             res.status(400).json({ error: 'No files uploaded for document PII' });
//             return;
//         }

//         const form = new FormData();
//         files.forEach((file) => {
//             form.append('files', fs.createReadStream(file.path), file.originalname);
//         });

//         try {
//             const response = await axios.post('http://localhost:5003/document-upload', form, {
//                 headers: form.getHeaders(),
//                 timeout: 30000,
//             });

//             files.forEach((file) => fs.unlinkSync(file.path));

//             if (clientWs && clientWs.readyState === WebSocket.OPEN) {
//                 clientWs.send(
//                     JSON.stringify({
//                         requestId,
//                         type: 'document-pii',
//                         results: response.data,
//                         done: true,
//                     })
//                 );
//             }

//             res.status(200).json({ status: 'PII scan complete' });
//         } catch (err: any) {
//             console.error('Document PII Error:', err.message);

//             if (clientWs && clientWs.readyState === WebSocket.OPEN) {
//                 clientWs.send(
//                     JSON.stringify({
//                         requestId,
//                         type: 'document-pii',
//                         error: 'Failed to analyze documents for PII',
//                         done: true,
//                     })
//                 );
//             }

//             res.status(500).json({ error: 'Failed to analyze documents for PII' });
//         }
//     })
// );
app.post(
  '/document-pii',
  upload.array('files'),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = String(req.query.id);
    const clientWs = socketsById.get(requestId) || null;

    const files = req.files as Express.Multer.File[] | undefined;
    const piiTypes = req.body.pii_types; // can be string or string[]

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded for document PII' });
      return;
    }

    const form = new FormData();
    files.forEach((file) => {
      form.append('files', fs.createReadStream(file.path), file.originalname);
    });

    // Add selected PII types to form
    if (piiTypes) {
      if (Array.isArray(piiTypes)) {
        piiTypes.forEach((type) => form.append('pii_types', type));
      } else {
        form.append('pii_types', piiTypes);
      }
    }

    try {
      const response = await axios.post('http://localhost:5003/document-upload', form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });

      // Cleanup uploaded files
      files.forEach((file) => fs.unlinkSync(file.path));

      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            requestId,
            type: 'document-pii',
            results: response.data,
            done: true,
          })
        );
      }

      res.status(200).json({ status: 'PII scan complete' });
    } catch (err: any) {
      console.error('Document PII Error:', err.message);

      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            requestId,
            type: 'document-pii',
            error: 'Failed to analyze documents for PII',
            done: true,
          })
        );
      }

      res.status(500).json({ error: 'Failed to analyze documents for PII' });
    }
  })
);


// Fallback route
app.use((_req, res) => {
    res.status(404).send('Not found');
});

// Start server
server.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
});
