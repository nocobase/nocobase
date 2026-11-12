import { z } from 'zod';
import type { DownloadToken } from './download-tokens.js';
const id = z.string().min(1).max(200);
const dateTime = z.string().meta({ format: 'date-time' });
export const DistTargetParams: z.ZodType<{ product: string; target: string }> =
  z.object({ product: id, target: id });
export const DistFileParams: z.ZodType<{
  product: string;
  version: string;
  file: string;
}> = z.object({
  product: id,
  version: id.describe('The version to read or restore.'),
  file: id.describe('The file to upload.'),
});

export const DistTargetQuery: z.ZodType<{
  format?: 'json' | 'env' | undefined;
  accept?: string | undefined;
}> = z.object({
  format: z.enum(['json', 'env']).optional(),
  accept: z.string().max(200).optional().meta({
    description:
      'The other answers the caller understands, comma-separated. `npm`: when the application has no tarball of the product but names its npm package, answer that package and exact version (`kind: npm`) instead of 404. Unknown values are ignored.',
  }),
});

export const DownloadTokenSchema: z.ZodType<DownloadToken> = z.object({
  token: z.string().meta({
    description:
      'The download token, shown only in this answer; the install script downloads the CLI with it.',
  }),
  expiresAt: dateTime,
  maxDownloads: z.number().int().meta({
    description: 'How many tarball downloads it allows, retries included.',
  }),
});
