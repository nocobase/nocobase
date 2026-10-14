/**
 * The images people send in messages, kept apart from the transcript the way the projects plugin keeps attachments:
 * the file plugin's server repository stores the bytes on the application's Drive disk and inserts the row
 * (`agentSessionImages`, with the session and its owner), and the Drive manager reads them back. The transcript names
 * each image by its row's id (`PromptPart.file`); the session's page loads it from
 * `GET /agentSessions/sessions/{sessionId}/images/{file}`, its owner's only. The agent still gets the image itself, in
 * the command that sends the message.
 *
 * Both are asked on each use; an application without the file plugin (or Drive) keeps images in the transcript as sent.
 */
import { randomUUID } from 'node:crypto';

import type { PromptContent, PromptPart } from '@nocobase/acp-bridge/protocol';

export const IMAGES = 'agentSessionImages';

/** Required by the file repository; nothing is served there: the plugin serves the bytes itself, after checking. */
const IMAGES_ACCESS_PATH = '/uploads/agent-session-images';

/** The file plugin's server repository, as far as uploading goes (`ServerFileRepositoryManager`). */
export interface ImageUploader {
  repository(
    collection: string,
    options: {
      readonly disk: string;
      readonly accessPath: string;
      readonly policy: {
        readonly read: true;
        readonly create: {
          readonly scope: true;
          readonly defaults: Readonly<Record<string, string>>;
        };
        readonly update: false;
        readonly delete: false;
      };
    },
  ): {
    uploadOne(input: { readonly file: File }): Promise<{
      readonly record: { readonly id: string };
    }>;
  };
}

/** A Drive manager, as far as reading goes. */
export interface ImageDisks {
  use(disk: string): { getBytes(key: string): Promise<Uint8Array> };
}

export interface ImageStorageDeps {
  /** Null when the application registers no file plugin. */
  readonly uploader: () => ImageUploader | null;
  readonly disks: () => ImageDisks | null;
  /** The Drive disk new images go to. */
  readonly disk: () => string;
}

/** Where a stored image's bytes are. */
export interface StoredImage {
  readonly disk: string;
  readonly key: string;
}

export interface ImageStorage {
  /**
   * The message as its transcript keeps it: each image stored for the session and named by its row, or the message
   * as sent when the application stores no files.
   */
  keep(
    session: { readonly id: string; readonly userId: string },
    content: readonly PromptContent[],
  ): Promise<PromptPart[]>;
  bytes(image: StoredImage): Promise<Uint8Array>;
}

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export function createImageStorage(deps: ImageStorageDeps): ImageStorage {
  return {
    async keep(session, content) {
      const uploader = deps.uploader();
      if (!uploader || !deps.disks()) return [...content];
      const repository = uploader.repository(IMAGES, {
        disk: deps.disk(),
        accessPath: IMAGES_ACCESS_PATH,
        policy: {
          read: true,
          create: {
            scope: true,
            defaults: { sessionId: session.id, userId: session.userId },
          },
          update: false,
          delete: false,
        },
      });
      const kept: PromptPart[] = [];
      // One at a time, so a message's images keep their order in storage as in the transcript.
      for (const part of content) {
        if (part.type !== 'image') {
          kept.push(part);
          continue;
        }
        const name = `image-${randomUUID()}.${EXTENSIONS[part.mimeType] ?? 'bin'}`;
        const { record } = await repository.uploadOne({
          file: new File([Buffer.from(part.data, 'base64')], name, {
            type: part.mimeType,
          }),
        });
        kept.push({
          type: 'image',
          mimeType: part.mimeType,
          file: String(record.id),
        });
      }
      return kept;
    },
    bytes(image) {
      const disks = deps.disks();
      if (!disks) throw new Error('This application stores no files.');
      return disks.use(image.disk).getBytes(image.key);
    },
  };
}
