import type { FileUploadLimit } from '@nocobase/app-plugin-file/client';

/** The standalone UI Library preview has no application or storage service. */
export function defaultFileUploadLimit(disk = 'local'): FileUploadLimit {
  return { disk, maxFileSizeMb: 20, maxBytes: 20 * 1024 * 1024 };
}
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- implements the public hook for the standalone preview
export function useFileUploadLimit(disk?: string): FileUploadLimit {
  return defaultFileUploadLimit(disk);
}
