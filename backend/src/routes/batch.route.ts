import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { PrismaClient } from "../../prisma/generated/prisma";

const router = Router();
const prisma = new PrismaClient();
// TODO: Change the batches to selected dependent ton the users id when proper user logic is implemented
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const batches = await prisma.batch.findMany({
      select: {
        id: true,
        scanType: true,
        totalNumFiles: true,
        createdAt: true,
      },
    });
    res.status(200).json(batches);
  })
);

router.get(
  "/:id/db",
  asyncHandler(async (req: Request, res: Response) => {
    const batchId = req.params.id;

    const dbs = await prisma.db.findMany({
      where: { batchId },
      select: {
        id: true,
        databaseName: true,
        scanType: true,
        dbType: true,
        totalNumOfTableScans: true,
        createdAt: true,
        dbFullPiiMetadata: {
          select: {
            tableName: true,
            rowCount: true,
            pii: true,
            identifiers: true,
            behavioral: true,
            owner: true,
          },
        },
        dbPiiResults: {
          // ✅ Correct field name
          select: {
            tableName: true,
            columnName: true,
            datatype: true,
            classification: true,
            scanned: true,
            matched: true,
            accuracy: true,
          },
        },
      },
    });

    res.status(200).json(dbs);
  })
);

router.get(
  "/:id/images",
  asyncHandler(async (req: Request, res: Response) => {
    const batchId = req.params.id;
    const images = await prisma.imageResult.findMany({
      where: { batchId },

      select: {
        id: true,
        fileName: true,
        label: true,
        confidence: true,
        createdAt: true,
      },
    });

    res.status(200).json(images);
  })
);

router.get(
  "/:id/documents",
  asyncHandler(async (req: Request, res: Response) => {
    const batchId = req.params.id;

    const documents = await prisma.documentResult.findMany({
      where: { batchId },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        piiFound: true,
        createdAt: true,
        classifications: {
          select: {
            piiType: true,
            count: true,
          },
        },
      },
    });

    res.status(200).json(documents);
  })
);

export default router;
