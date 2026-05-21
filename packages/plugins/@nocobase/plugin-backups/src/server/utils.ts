export const BACKUP_EXTENSION = 'nbdata';
export const STORAGE_PATH = 'storage/uploads';
export const SETTINGS = 'backupSettings';
export const BACKUPS = 'backups';
export const FILE_ENCRYPTION_SALT = 'backup salt';
export const BACKUP_TASKS_CACHE_NAME = 'backup-task-results';
export const RESTORE_TASKS_CACHE_NAME = 'restore-task-results';

import { Writable, Transform, TransformCallback } from 'stream';
import yauzl from 'yauzl';
import fs from 'fs-extra';
import path from 'path';
import Database from '@nocobase/database';
import { QueryTypes } from 'sequelize';

// @ts-ignore
import { name } from '../../package.json';

export const PLUGIN_BACKUPS_NAME = name;

export class Extractor extends Writable {
  private tempFile: string;
  private extractPath: string;
  private tempWriteStream: fs.WriteStream | null = null;

  constructor(options: { path: string }) {
    super();
    this.extractPath = options.path;
    this.tempFile = path.join(this.extractPath, `temp_${Date.now()}.zip`);
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (!this.tempWriteStream) {
      fs.mkdirp(path.dirname(this.tempFile))
        .then(() => {
          this.tempWriteStream = fs.createWriteStream(this.tempFile);
          this.tempWriteStream.write(chunk, encoding, callback);
        })
        .catch(callback);
    } else {
      this.tempWriteStream.write(chunk, encoding, callback);
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.tempWriteStream) {
      this.tempWriteStream.end(async () => {
        try {
          await this.extract();
          await fs.unlink(this.tempFile);
          callback();
        } catch (error) {
          callback(error as Error);
        }
      });
    }
  }

  private async extract(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      yauzl.open(this.tempFile, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);
        if (!zipfile) return reject(new Error('Failed to open zip file'));

        zipfile.on('error', reject);
        zipfile.on('end', resolve);

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          const fullPath = path.join(this.extractPath, entry.fileName);

          if (entry.fileName.endsWith('/')) {
            fs.mkdirp(fullPath)
              .then(() => zipfile.readEntry())
              .catch(reject);
            return;
          }

          fs.mkdirp(path.dirname(fullPath))
            .then(() => {
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);
                if (!readStream) return reject(new Error('Failed to open read stream'));

                const writeStream = fs.createWriteStream(fullPath);
                readStream.pipe(writeStream);

                writeStream.on('finish', () => {
                  zipfile.readEntry();
                });
                writeStream.on('error', reject);
              });
            })
            .catch(reject);
        });
      });
    });
  }

  promise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.on('finish', resolve);
      this.on('error', reject);
    });
  }
}

export function humanFileSize(bytes: number, si = false, dp = 1): string {
  const thresh = si ? 1000 : 1024;
  const units = si
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

  let u = 0;

  while (Math.abs(bytes) >= thresh && u < units.length - 1) {
    bytes /= thresh;
    u++;
  }

  return bytes.toFixed(dp) + ' ' + units[u];
}

const dbVersionCommands = {
  sqlite: 'select sqlite_version() as version',
  mysql: 'select version() as version',
  mariadb: 'select version() as version',
  postgres: 'select version() as version',
};

export async function getDBVersion(db: Database): Promise<string> {
  const dialect = db.sequelize.getDialect();
  const sqlCmd = dbVersionCommands[dialect];
  if (!sqlCmd) {
    throw new Error(`unsupported dialect ${dialect}`);
  }

  const result = await db.sequelize.query<{ version: string }>(sqlCmd, {
    type: QueryTypes.SELECT,
  });

  return result?.[0]?.version || '';
}

export function isQsTruly(value?: string | boolean) {
  try {
    return !!value && JSON.parse(`${value}`.toLowerCase());
  } catch (_e) {}
  return false;
}

export function toMajorVersion(raw: string): string {
  const m = /([\d+.]+)/.exec(raw);
  return m != null ? m[0].replace(/\..+$/, '') : undefined;
}

/**
 * Transform stream that replaces \' with '' while properly handling UTF-8 character boundaries
 * This prevents issues when restoring MySQL backups on Windows
 */
export class EscapeQuoteTransform extends Transform {
  private bufferBytes: Buffer = Buffer.alloc(0);

  constructor() {
    super({ objectMode: false });
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    try {
      // Accumulate bytes first
      const buffers = [this.bufferBytes, chunk] as Buffer[];
      this.bufferBytes = Buffer.concat(buffers as unknown as Uint8Array[]);

      // Find the last complete UTF-8 character boundary
      let processBytes = this.bufferBytes;
      let remainingBytes = Buffer.alloc(0);

      // Look for incomplete UTF-8 sequences at the end
      // UTF-8 multi-byte sequences: 110xxxxx, 1110xxxx, 11110xxx
      for (let i = Math.max(0, this.bufferBytes.length - 4); i < this.bufferBytes.length; i++) {
        const byte = this.bufferBytes[i];

        // Check if this is the start of a multi-byte sequence
        if ((byte & 0x80) === 0) {
          // ASCII character, safe
          continue;
        } else if ((byte & 0xe0) === 0xc0) {
          // 2-byte sequence start (110xxxxx)
          if (i + 1 >= this.bufferBytes.length) {
            // Incomplete sequence
            processBytes = this.bufferBytes.subarray(0, i);
            remainingBytes = this.bufferBytes.subarray(i);
            break;
          }
        } else if ((byte & 0xf0) === 0xe0) {
          // 3-byte sequence start (1110xxxx)
          if (i + 2 >= this.bufferBytes.length) {
            // Incomplete sequence
            processBytes = this.bufferBytes.subarray(0, i);
            remainingBytes = this.bufferBytes.subarray(i);
            break;
          }
        } else if ((byte & 0xf8) === 0xf0) {
          // 4-byte sequence start (11110xxx)
          if (i + 3 >= this.bufferBytes.length) {
            // Incomplete sequence
            processBytes = this.bufferBytes.subarray(0, i);
            remainingBytes = this.bufferBytes.subarray(i);
            break;
          }
        }
      }

      // Convert the safe bytes to string
      if (processBytes.length > 0) {
        let text = processBytes.toString('utf8');

        // Handle escape sequence boundaries - if ends with backslash, preserve it
        if (text.endsWith('\\')) {
          const lastBackslashIndex = text.lastIndexOf('\\');
          const beforeBackslash = text.slice(0, lastBackslashIndex);
          const backslashPart = text.slice(lastBackslashIndex);

          // Add backslash part back to remaining bytes
          const backslashBytes = Buffer.from(backslashPart, 'utf8');
          remainingBytes = Buffer.concat([backslashBytes, remainingBytes] as any);

          text = beforeBackslash;
        }

        // Process the replacement
        if (text) {
          const processed = text.replace(/\\'/g, "''");
          this.push(Buffer.from(processed, 'utf8'));
        }
      }

      // Keep remaining bytes for next chunk
      this.bufferBytes = remainingBytes;

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback: Function) {
    try {
      // Process any remaining bytes
      if (this.bufferBytes.length > 0) {
        const text = this.bufferBytes.toString('utf8');
        const processed = text.replace(/\\'/g, "''");
        this.push(Buffer.from(processed, 'utf8'));
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
