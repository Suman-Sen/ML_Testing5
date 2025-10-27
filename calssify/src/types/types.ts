export interface Metadata {
  [key: string]: string | number | null | undefined;
}

export type PayloadType = {
  conn_string: string;
  scan_type: string;
  db_type: string;
  table_name?: string;
  pii_types?: string[] | string;
};

export interface ClassificationResult {
  filename: string;
  label?: string;
  inferred_label?: string;
  metadata?: Metadata;
  pii_type?: string;
  table?: string;
  column?: string;
  value?: string | number | null;
  showMetadata?: boolean;
}

export interface DocumentPiiResult {
  file_name: string;
  pii_found: boolean;
  locations?: Record<string, string[]>;
  pii_types?: Record<string, string[]>;
  [k: string]: unknown;
  showMetadata?: boolean;
}
