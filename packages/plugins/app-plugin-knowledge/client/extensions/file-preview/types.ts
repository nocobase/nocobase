/**
 * The file plugin's preview components (its Registry item `component-ui`), installed here as the knowledge base's own
 * source: what they read of a file. The knowledge base gives each file's `contentUrl`, its own route.
 */
import type { FileRecord } from '@nocobase/app-plugin-file/client';

export type { FileRecord } from '@nocobase/app-plugin-file/client';

export interface FileThumbnailProps {
  readonly file: FileRecord;
  readonly url?: string;
  readonly alt?: string;
}
