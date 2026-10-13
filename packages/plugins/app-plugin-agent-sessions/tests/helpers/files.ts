import { randomUUID } from 'node:crypto';

import type { DatabaseManager } from '@nocobase/db';

import {
  createImageStorage,
  type ImageStorage,
  type ImageUploader,
} from '../../server/images.js';

/**
 * The file plugin's repository and Drive, as far as images go: an upload keeps the bytes in memory and inserts the
 * row with the policy's defaults, into `database` when one is given.
 */
export function fakeFiles(database?: DatabaseManager): {
  readonly objects: Map<string, Uint8Array>;
  readonly uploads: { collection: string; file: File; defaults: object }[];
  readonly storage: ImageStorage;
} {
  const objects = new Map<string, Uint8Array>();
  const uploads: { collection: string; file: File; defaults: object }[] = [];
  const uploader: ImageUploader = {
    repository: (collection, options) => ({
      async uploadOne({ file }) {
        const id = randomUUID();
        const key = `objects/${id}.png`;
        objects.set(key, new Uint8Array(await file.arrayBuffer()));
        uploads.push({
          collection,
          file,
          defaults: options.policy.create.defaults,
        });
        const now = new Date().toISOString();
        await database
          ?.connection()
          .repository(collection)
          .createOne({
            values: {
              id,
              disk: options.disk,
              key,
              filename: file.name,
              ext: 'png',
              mimeType: file.type,
              size: file.size,
              ...options.policy.create.defaults,
              createdAt: now,
              updatedAt: now,
            },
          });
        return { record: { id } };
      },
    }),
  };
  const disks = {
    // Drive's own name for choosing a disk, not a hook.
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    use: (disk: string) => ({
      getBytes: (key: string) => {
        const bytes = objects.get(key);
        return bytes && disk === 'local'
          ? Promise.resolve(bytes)
          : Promise.reject(new Error('No such object.'));
      },
    }),
  };
  return {
    objects,
    uploads,
    storage: createImageStorage({
      uploader: () => uploader,
      disks: () => disks,
      disk: () => 'local',
    }),
  };
}
