export interface FileUploadLimit {
  readonly disk: string;
  readonly maxFileSizeMb: number;
  readonly maxBytes: number;
}
export interface FileUploadLimits {
  readonly default: string;
  readonly disks: Readonly<Record<string, FileUploadLimit>>;
}
/** Fallback for standalone compositions without Drive/File registration. */
export function defaultFileUploadLimit(disk = 'local'): FileUploadLimit {
  return { disk, maxFileSizeMb: 20, maxBytes: 20 * 1024 * 1024 };
}
