import type { BackupTools } from '@nocobase/backup';
import type { AppConfig } from '../config/index.js';

export type AppBackupFileReference = {
  connection?: string;
  schema?: string;
  table: string;
  keyColumn: string;
} & (
  { disk: string; diskColumn?: never } | { diskColumn: string; disk?: never }
);

export interface AppBackupConfig {
  /** Paths beneath each filesystem disk to preserve on backup and restore. */
  excludePaths?: readonly string[];
  /** Reference columns outside the conventional disk/key pair. */
  fileReferences?: readonly AppBackupFileReference[];
  connections?: Readonly<
    Record<
      string,
      {
        hosting?: 'managed' | 'self-managed';
        tls?: { mode: 'require' | 'verify-full'; caFile?: string };
      }
    >
  >;
  tools?: BackupTools;
}

export function registerBackupConfig(config: AppConfig): void {
  config.mergeDefaults({
    backup: {
      excludePaths: [],
      fileReferences: [],
      connections: {},
      tools: {},
    },
  });
}
