export type BackupDialect = 'sqlite' | 'postgres' | 'mysql';
export type BackupServerType = BackupDialect | 'mariadb';

export interface MigrationFingerprint {
  packageName: string;
  name: string;
  checksum: string;
}

export interface KeyFingerprint {
  version: string;
  fingerprint: string;
}

export interface BackupTable {
  name: string;
  schema?: string;
}

/** A read-only view of the data represented by the artifact currently being exported. */
export interface BackupReader {
  hasTable(table: BackupTable): Promise<boolean>;
  findTables(columns: readonly string[]): Promise<BackupTable[]>;
  readRows(
    table: BackupTable,
    columns: readonly string[],
  ): AsyncIterable<Readonly<Record<string, unknown>>>;
}

export interface FileReference {
  disk: string;
  key: string;
}

interface ConnectionBase {
  name: string;
  schemaManagement: 'managed' | 'external';
  readMigrations(
    reader: BackupReader,
  ): Promise<readonly MigrationFingerprint[]>;
  /** Migration sources for the running application version, including unapplied sources. */
  readMigrationCatalog(): Promise<readonly MigrationFingerprint[]>;
  readFileReferences?(
    reader: BackupReader,
  ): AsyncIterable<FileReference> | Iterable<FileReference>;
}

export interface SqliteBackupConnection extends ConnectionBase {
  dialect: 'sqlite';
  filename: string;
}

interface ServerConnection extends ConnectionBase {
  host?: string;
  port?: number;
  database: string;
  username: string;
  password?: string;
  /** Permit recovery-point fallback for a server that denies logical exports. */
  hosting?: 'managed' | 'self-managed';
}

export interface PostgresBackupConnection extends ServerConnection {
  dialect: 'postgres';
  tls?: { mode: 'require' | 'verify-full'; caFile?: string };
}

export interface MysqlBackupConnection extends ServerConnection {
  dialect: 'mysql';
  socketPath?: string;
  tls?: { mode: 'require' | 'verify-full'; caFile?: string };
}

export type BackupConnection =
  SqliteBackupConnection | PostgresBackupConnection | MysqlBackupConnection;

export type BackupDisk =
  | {
      name: string;
      driver: 'fs';
      root: string;
      excludePaths?: readonly string[];
    }
  | { name: string; driver: 's3' | 'oss'; bucket: string; prefix?: string };

export interface BackupTools {
  pgDump?: string;
  pgRestore?: string;
  psql?: string;
  mysqlDump?: string;
  mysql?: string;
  mariadbDump?: string;
  mariadb?: string;
}

export interface BackupTarget {
  appName: string;
  appVersion: string;
  connections: readonly BackupConnection[];
  disks: readonly BackupDisk[];
  keyFingerprints: readonly KeyFingerprint[];
  /** Absolute paths. A directory protects its entire subtree. */
  skipPaths?: readonly string[];
  tools?: BackupTools;
  /** Check the existence of a referenced object on a configured remote disk. */
  remoteFileExists?(reference: FileReference): Promise<boolean | undefined>;
  /**
   * Confirm the application is stopped and keep it stopped for the operation.
   * Throw a BackupError with RESTORE_APP_RUNNING if the guard cannot be acquired.
   * The guard must remain valid while the database contents are replaced.
   */
  withStoppedApp?<T>(operation: () => Promise<T>): Promise<T>;
  /** Hold and release a Drive deletion deferral lease even if the operation fails. */
  withDeferredDeletes?<T>(
    disks: readonly string[],
    operation: () => Promise<T>,
    /** Find the disk that actually contributed this absolute file path, after capture succeeds. */
    findCapturedDisk: (file: string) => string | undefined,
  ): Promise<T>;
}

export interface CreateBackupOptions {
  output: string;
  online?: boolean;
  includeConnections?: readonly string[];
  excludeConnections?: readonly string[];
  includeDisks?: readonly string[];
  excludeDisks?: readonly string[];
  tmpDir?: string;
  signal?: AbortSignal;
}

export interface VerifyBackupOptions {
  target?: BackupTarget;
  tools?: BackupTools;
  sha256?: string;
  tmpDir?: string;
  signal?: AbortSignal;
}

export interface RestoreBackupOptions {
  connections?: readonly string[];
  allowPartial?: boolean;
  filesOnly?: boolean;
  sha256?: string;
  tmpDir?: string;
  signal?: AbortSignal;
}

export interface ServerInfo {
  type: BackupServerType;
  version: string;
  majorVersion: number;
  charset: string;
  lowerCaseTableNames?: number;
}

export interface SnapshotInfo {
  time: string;
  lsn?: string;
}

interface ConnectionManifestBase {
  name: string;
  dialect: BackupDialect;
}

interface IncludedConnectionManifest extends ConnectionManifestBase {
  server: ServerInfo;
  snapshot: SnapshotInfo;
  migrations: {
    history: MigrationFingerprint[];
    last: MigrationFingerprint | null;
    sha256: string;
  };
}

export type ConnectionManifest =
  | (ConnectionManifestBase & {
      mode: 'excluded';
      reason: 'external' | 'excluded' | 'unselected';
    })
  | (IncludedConnectionManifest & {
      mode: 'dump';
      path: string;
      sha256: string;
      size: number;
    })
  | (IncludedConnectionManifest & {
      mode: 'recovery-point';
      reason: 'export-permission-denied';
    });

export type DiskManifest =
  | {
      name: string;
      driver: BackupDisk['driver'];
      mode: 'excluded';
      reason: 'excluded' | 'unselected';
    }
  | {
      name: string;
      driver: 's3' | 'oss';
      mode: 'reference';
      bucket: string;
      prefix?: string;
    }
  | {
      name: string;
      driver: 'fs';
      mode: 'files';
      count: number;
      size: number;
      skippedPaths: string[];
    };

export interface BackupManifest {
  formatVersion: 1;
  app: { name: string; version: string };
  createdAt: string;
  online: boolean;
  connections: ConnectionManifest[];
  disks: DiskManifest[];
  secrets: { fingerprints: KeyFingerprint[] };
  indexSha256: string;
  limitations: string[];
}

export interface CreateBackupResult {
  file: string;
  sha256: string;
  size: number;
  manifest: BackupManifest;
}

export interface BackupProblem {
  code: string;
  message: string;
  details?: Readonly<Record<string, unknown>>;
}

export type VerifyBackupResult =
  | { ok: true; problems: []; manifest: BackupManifest; sha256: string }
  | { ok: false; problems: BackupProblem[] };

export interface RestoreItem {
  name: string;
  status:
    | 'pending'
    | 'skipped'
    | 'restored'
    | 'failed'
    | 'rolled-back'
    | 'rollback-failed';
  problem?: BackupProblem;
}

export interface RestoreBackupResult {
  connections: RestoreItem[];
  disks: RestoreItem[];
  missingFiles: FileReference[];
}
