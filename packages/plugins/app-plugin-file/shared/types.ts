export interface FileRecord {
  id: string;
  disk: string;
  key: string;
  filename: string;
  ext: string;
  mimeType: string;
  /** BIGINT-backed collections return an exact string; integer-backed ones return a number. */
  size: string | number;
  createdAt: Date | string;
  updatedAt: Date | string;
  /** Present when the selected record includes id and ext. Never persisted. */
  contentUrl?: string;
}

export interface UploadOneInput {
  readonly file: File;
}
export interface UploadManyInput {
  readonly files: readonly File[];
}
/** A related record returned by the upload API. */
export interface CreatedTargetReference {
  readonly clientKey: string;
  readonly collection: string;
  readonly unique: {
    readonly kind: 'unique';
    readonly fields: readonly string[];
    readonly values: Readonly<Record<string, unknown>>;
  };
}

export interface UploadOneResult {
  readonly record: FileRecord;
  readonly createdTargets: readonly CreatedTargetReference[];
  readonly version?: string | number;
}
export interface UploadManyResult {
  readonly createdCount: number;
  readonly records: readonly FileRecord[];
}
