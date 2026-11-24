import type { BackupTools } from '@nocobase/backup';
import type { AppConfig } from '../config/index.js';

export type AppBackupFileReference = {
  connection?: string;
  schema?: string;
  table: string;
  keyColumn: string;
  keyPrefix?: string;
} & (
  { disk: string; diskColumn?: never } | { diskColumn: string; disk?: never }
);

export interface AppBackupConfig {
  /** Disk-relative paths to omit from backup and preserve on restore. */
  disks?: Readonly<Record<string, { excludePaths?: readonly string[] }>>;
  /** Reference columns outside the conventional disk/key pair. */
  fileReferences?: readonly AppBackupFileReference[];
  connections?: Readonly<
    Record<
      string,
      {
        tls?: { mode: 'require' | 'verify-full'; caFile?: string };
      }
    >
  >;
  tools?: BackupTools;
}

export function registerBackupConfig(config: AppConfig): void {
  config.mergeDefaults({
    backup: {
      disks: {},
      fileReferences: [],
      connections: {},
      tools: {},
    },
  });
}
