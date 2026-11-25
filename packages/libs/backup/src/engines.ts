import type {
  BackupConnection,
  BackupReader,
  BackupTools,
  MigrationFingerprint,
  ServerInfo,
  SnapshotInfo,
  FileReference,
} from './types.js';

export interface EngineContext {
  directory: string;
  tools: BackupTools;
  signal?: AbortSignal;
}

export interface SnapshotData {
  migrations: readonly MigrationFingerprint[];
  references: FileReference[];
}

export interface DatabaseExport extends SnapshotData {
  server: ServerInfo;
  snapshot: SnapshotInfo;
}

export interface DatabaseEngine<Connection extends BackupConnection> {
  export(
    connection: Connection,
    file: string,
    options: EngineContext & {
      online: boolean;
      collect?: (reader: BackupReader) => Promise<SnapshotData>;
    },
  ): Promise<DatabaseExport>;
  verify(
    file: string,
    server: ServerInfo,
    context: EngineContext,
  ): Promise<void>;
  probe(connection: Connection): Promise<ServerInfo>;
  restore(
    connection: Connection,
    file: string,
    server: ServerInfo,
    context: EngineContext,
  ): Promise<void>;
  read<Output>(
    connection: Connection,
    use: (reader: BackupReader) => Promise<Output>,
  ): Promise<Output>;
}

export function quoteIdentifier(name: string, delimiter: '`' | '"'): string {
  return (
    delimiter + name.replaceAll(delimiter, delimiter.repeat(2)) + delimiter
  );
}

export function serverMajor(version: string): number {
  return Number.parseInt(version, 10);
}

export const emptySnapshot: SnapshotData = { migrations: [], references: [] };
