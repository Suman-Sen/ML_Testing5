import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

type DbPiiResult = {
  tableName: string;
  columnName: string;
  datatype: string;
  classification: string;
  scanned: boolean;
  matched: number;
  accuracy: number;
};

type DbFullPiiMetadata = {
  tableName: string;
  rowCount: number;
  pii: string[] | null;
  identifiers: string[] | null;
  behavioral: string[] | null;
  owner: string | null;
};

type DbItem = {
  id: string;
  databaseName: string;
  scanType: string;
  dbType: string;
  totalNumOfTableScans: number;
  createdAt: string;
  dbFullPiiMetadata: DbFullPiiMetadata[];
  dbPiiResults: DbPiiResult[];
};

type ImageResult = {
  id: string;
  fileName: string;
  label: string;
  confidence: number;
  createdAt: string;
};

type DocumentClassification = {
  piiType: string;
  count: number;
};

type DocumentResult = {
  id: string;
  fileName: string;
  fileType: string;
  piiFound: boolean;
  createdAt: string;
  classifications: DocumentClassification[];
};

type Tab = 'db' | 'images' | 'documents';

const API_BASE = 'http://localhost:3000';

const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [active, setActive] = useState<Tab>('db');
  const [dbs, setDbs] = useState<DbItem[] | null>(null);
  const [images, setImages] = useState<ImageResult[] | null>(null);
  const [docs, setDocs] = useState<DocumentResult[] | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const fetchDb = axios.get<DbItem[]>(`${API_BASE}/batches/${id}/db`);
    const fetchImages = axios.get<ImageResult[]>(`${API_BASE}/batches/${id}/images`);
    const fetchDocs = axios.get<DocumentResult[]>(`${API_BASE}/batches/${id}/documents`);

    Promise.all([fetchDb, fetchImages, fetchDocs])
      .then(([dbRes, imgRes, docRes]) => {
        setDbs(dbRes.data);
        setImages(imgRes.data);
        setDocs(docRes.data);
      })
      .catch((e) => {
        console.error(e);
        setError(e?.message || 'Failed to load batch details');
      });
  }, [id]);

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600 mb-3">Error: {error}</p>
        <Link className="text-blue-600 underline" to="/batches">Back to Batches</Link>
      </div>
    );
  }

  if (!dbs || !images || !docs) {
    return <div className="p-4">Loading…</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Batch {id}</h1>
        <Link className="text-blue-600 underline" to="/batches">← Back</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b">
        {(['db', 'images', 'documents'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`py-2 px-3 -mb-px border-b-2 ${
              active === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'
            }`}
            onClick={() => setActive(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === 'db' && (
        <section className="space-y-4">
          {dbs.length === 0 ? (
            <p className="text-gray-600">No DB entries.</p>
          ) : (
            dbs.map((db) => (
              <div key={db.id} className="p-4 border rounded">
                <h2 className="font-semibold">{db.databaseName}</h2>
                <p className="text-sm text-gray-600">
                  Type: {db.dbType} | Scan: {db.scanType} | Tables scanned: {db.totalNumOfTableScans} |{' '}
                  {new Date(db.createdAt).toLocaleString()}
                </p>

                <div className="mt-3">
                  <h3 className="font-medium">PII Results ({db.dbPiiResults.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-1 pr-4">Table</th>
                          <th className="py-1 pr-4">Column</th>
                          <th className="py-1 pr-4">Type</th>
                          <th className="py-1 pr-4">Matched</th>
                          <th className="py-1 pr-4">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {db.dbPiiResults.map((r, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-1 pr-4">{r.tableName}</td>
                            <td className="py-1 pr-4">{r.columnName}</td>
                            <td className="py-1 pr-4">{r.classification}</td>
                            <td className="py-1 pr-4">{r.matched}</td>
                            <td className="py-1 pr-4">{r.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-medium">Full PII Metadata ({db.dbFullPiiMetadata.length})</h3>
                  <ul className="list-disc ml-6 text-sm">
                    {db.dbFullPiiMetadata.map((m, i) => (
                      <li key={i}>
                        <strong>{m.tableName}</strong> — rows: {m.rowCount} | owner: {m.owner ?? 'N/A'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {active === 'images' && (
        <section className="space-y-2">
          {images.length === 0 ? (
            <p className="text-gray-600">No image results.</p>
          ) : (
            <ul className="space-y-2">
              {images.map((img) => (
                <li key={img.id} className="p-3 border rounded">
                  <div className="font-medium">{img.fileName}</div>
                  <div className="text-sm text-gray-600">
                    Label: {img.label} | Confidence: {Math.round(img.confidence * 100) / 100} |{' '}
                    {new Date(img.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {active === 'documents' && (
        <section className="space-y-2">
          {docs.length === 0 ? (
            <p className="text-gray-600">No documents.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li key={doc.id} className="p-3 border rounded">
                  <div className="font-medium">
                    {doc.fileName} <span className="text-xs text-gray-600">({doc.fileType})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    PII Found: {doc.piiFound ? 'Yes' : 'No'} | {new Date(doc.createdAt).toLocaleString()}
                  </div>
                  {doc.classifications?.length ? (
                    <ul className="list-disc ml-6 text-sm">
                      {doc.classifications.map((c, i) => (
                        <li key={i}>{c.piiType}: {c.count}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default BatchDetailsPage;