// // // import express, { Request, Response, NextFunction } from 'express';
// // // server.ts
// // import express, { Request, Response, NextFunction } from 'express';
// // import multer from 'multer';
// // import cors from 'cors';
// // import fs from 'fs';
// // import axios from 'axios';
// // import FormData from 'form-data';
// // import { WebSocketServer } from 'ws';
// // import http from 'http';

// // const app = express();
// // const server = http.createServer(app);
// // const wss = new WebSocketServer({ server });
// // const port = 3000;
// // const upload = multer({ dest: 'uploads/' });

// // app.use(cors());

// // interface ClientMessage {
// //   id: string;
// //   type: 'classify' | 'metadata';
// // }

// // interface MetadataResult {
// //   filename: string;
// //   inferred_label: string;
// //   metadata: Record<string, any>;
// // }

// // interface ClassifyResult {
// //   filename: string;
// //   label: string;
// //   metadata: Record<string, any>;
// // }

// // function chunkArray<T>(arr: T[], size: number): T[][] {
// //   const chunks: T[][] = [];
// //   for (let i = 0; i < arr.length; i += size) {
// //     chunks.push(arr.slice(i, i + size));
// //   }
// //   return chunks;
// // }

// // function asyncHandler(
// //   fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
// // ): express.RequestHandler {
// //   return (req, res, next) => {
// //     fn(req, res, next).catch(next);
// //   };
// // }

// // const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// // let globalWs: import('ws').WebSocket | null = null;
// // let requestId: string = '';
// // let scanType: 'classify' | 'metadata' = 'classify';

// // wss.on('connection', (ws) => {
// //   globalWs = ws;

// //   ws.on('message', (message) => {
// //     const parsed: ClientMessage = JSON.parse(message.toString());
// //     requestId = parsed.id;
// //     scanType = parsed.type;
// //   });
// // });

// // app.post(
// //   '/upload',
// //   upload.array('images'),
// //   asyncHandler(async (req: Request, res: Response) => {
// //     const files = req.files as Express.Multer.File[];
// //     const batches = chunkArray(files, 5);

// //     for (const batch of batches) {
// //       const results = await Promise.all(
// //         batch.map(async (file) => {
// //           const form = new FormData();
// //           form.append('image', fs.createReadStream(file.path), file.originalname);

// //           const url =
// //             scanType === 'classify'
// //               ? 'http://localhost:6000/predict'
// //               : 'http://localhost:6000/metadata';

// //           try {
// //             const response = await axios.post(url, form, {
// //               headers: form.getHeaders(),
// //               timeout: 20000,
// //             });

// //             return scanType === 'classify'
// //               ? {
// //                   filename: file.originalname,
// //                   label: response.data.label,
// //                   metadata: response.data.metadata || {},
// //                 }
// //               : {
// //                   filename: file.originalname,
// //                   inferred_label: response.data.file_based,
// //                   metadata: response.data.metadata || {},
// //                 };
// //           } catch (e) {
// //             return scanType === 'classify'
// //               ? {
// //                   filename: file.originalname,
// //                   label: 'Error',
// //                   metadata: {},
// //                 }
// //               : {
// //                   filename: file.originalname,
// //                   inferred_label: 'Error',
// //                   metadata: {},
// //                 };
// //           } finally {
// //             try {
// //               fs.unlinkSync(file.path);
// //             } catch {}
// //           }
// //         })
// //       );

// //     //   await sleep(1500); // Delay between batches

// //       if (globalWs && globalWs.readyState === globalWs.OPEN) {
// //         globalWs.send(
// //           JSON.stringify({
// //             requestId,
// //             type: scanType,
// //             batch: results,
// //           })
// //         );
// //       }
// //     }

// //     res.status(200).json({ status: 'Uploaded' });
// //   })
// // );

// // app.use((_req, res) => {
// //   res.status(404).send('Not found');
// // });

// // server.listen(port, () => {
// //   console.log(`Server running at http://localhost:${port}`);
// // });


// import express, { Request, Response, NextFunction } from 'express';
// import multer from 'multer';
// import cors from 'cors';
// import fs from 'fs';
// import axios from 'axios';
// import FormData from 'form-data';
// import { WebSocketServer } from 'ws';
// import http from 'http';

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocketServer({ server });
// const port = 3000;
// const upload = multer({ dest: 'uploads/' });

// app.use(cors());
// app.use(express.json()); // For parsing JSON bodies

// interface ClientMessage {
//   id: string;
//   type: 'classify' | 'metadata';
// }

// interface MetadataResult {
//   filename: string;
//   inferred_label: string;
//   metadata: Record<string, any>;
// }

// interface ClassifyResult {
//   filename: string;
//   label: string;
//   metadata: Record<string, any>;
// }

// function chunkArray<T>(arr: T[], size: number): T[][] {
//   const chunks: T[][] = [];
//   for (let i = 0; i < arr.length; i += size) {
//     chunks.push(arr.slice(i, i + size));
//   }
//   return chunks;
// }

// function asyncHandler(
//   fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
// ): express.RequestHandler {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// }

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// let globalWs: import('ws').WebSocket | null = null;
// let requestId: string = '';
// let scanType: 'classify' | 'metadata' = 'classify';

// wss.on('connection', (ws) => {
//   globalWs = ws;

//   ws.on('message', (message) => {
//     const parsed: ClientMessage = JSON.parse(message.toString());
//     requestId = parsed.id;
//     scanType = parsed.type;
//   });
// });

// app.post(
//   '/upload',
//   upload.array('images'),
//   asyncHandler(async (req: Request, res: Response) => {
//     const files = req.files as Express.Multer.File[];
//     const batches = chunkArray(files, 5);

//     for (const batch of batches) {
//       const results = await Promise.all(
//         batch.map(async (file) => {
//           const form = new FormData();
//           form.append('image', fs.createReadStream(file.path), file.originalname);

//           const url =
//             scanType === 'classify'
//               ? 'http://localhost:6000/predict'
//               : 'http://localhost:6000/metadata';

//           try {
//             const response = await axios.post(url, form, {
//               headers: form.getHeaders(),
//               timeout: 20000,
//             });

//             return scanType === 'classify'
//               ? {
//                   filename: file.originalname,
//                   label: response.data.label,
//                   metadata: response.data.metadata || {},
//                 }
//               : {
//                   filename: file.originalname,
//                   inferred_label: response.data.file_based,
//                   metadata: response.data.metadata || {},
//                 };
//           } catch (e) {
//             return scanType === 'classify'
//               ? {
//                   filename: file.originalname,
//                   label: 'Error',
//                   metadata: {},
//                 }
//               : {
//                   filename: file.originalname,
//                   inferred_label: 'Error',
//                   metadata: {},
//                 };
//           } finally {
//             try {
//               fs.unlinkSync(file.path);
//             } catch {}
//           }
//         })
//       );

//       if (globalWs && globalWs.readyState === globalWs.OPEN) {
//         globalWs.send(
//           JSON.stringify({
//             requestId,
//             type: scanType,
//             batch: results,
//           })
//         );
//       }
//     }

//     res.status(200).json({ status: 'Uploaded' });
//   })
// );

// //  Flask PII bridge route (calls localhost:5000)
// app.post(
//   '/pii',
//   asyncHandler(async (req: Request, res: Response) => {
//     const { conn_string, type, table } = req.body;

//     let endpoint = '';
//     const payload: any = { conn_string };

//     switch (type) {
//       case 'pii-meta':
//         endpoint = '/metadata-classify';
//         break;
//       case 'pii-full':
//         endpoint = '/full-pii-scan';
//         break;
//       case 'pii-table':
//         endpoint = '/table-pii-scan';
//         payload.table_name = table;
//         break;
//       default:
//         res.status(400).json({ error: 'Invalid PII scan type' });
//         return;
//     }

//     try {
//       const response = await axios.post(`http://localhost:5000${endpoint}`, payload, {
//         // timeout: 15000,
//       });

//       res.json({ data: response.data });

//       if (globalWs && globalWs.readyState === globalWs.OPEN) {
//         globalWs.send(
//           JSON.stringify({
//             requestId,
//             type,
//             piiResult: response.data,
//           })
//         );
//       }
//     } catch (err: any) {
//       console.error('PII Bridge Error:', err.message);
//       res.status(500).json({ error: 'Failed to query Flask PII service' });
//     }
//   })
// );

// app.use((_req, res) => {
//   res.status(404).send('Not found');
// });

// server.listen(port, () => {
//   console.log(`Express server running at http://localhost:${port}`);
// });

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

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
  type: 'classify' | 'metadata';
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

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): express.RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// Map of active WebSocket connections by requestId
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

// Upload endpoint
app.post(
  '/upload',
  upload.array('images'),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const id = String(req.query.id);
    const scanType = String(req.query.type) as 'classify' | 'metadata';
    const clientWs = socketsById.get(id) || null;

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
            if (scanType === 'classify') {
              return { filename: file.originalname, label: 'Error', metadata: {} };
            } else {
              return { filename: file.originalname, inferred_label: 'Error', metadata: {} };
            }
          } finally {
            try {
              fs.unlinkSync(file.path);
            } catch {}
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

    // Signal end of batches
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ requestId: id, type: scanType, done: true }));
    }

    res.status(200).json({ status: 'Uploaded' });
  })
);

// PII Bridge Route (unchanged HTTP response)
app.post(
  '/pii',
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
      res.status(500).json({ error: 'Failed to query Flask PII service' });
    }
  })
);

// Fallback for unknown routes
app.use((_req, res) => {
  res.status(404).send('Not found');
});

// Start server
server.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});
