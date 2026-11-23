/**
 * The features that store files, as plugins and applications declare them. The registry lives in memory: each plugin
 * declares its file Collections when it boots, and the file storage settings page reads them back. Nothing is
 * persisted, so a feature that is no longer registered simply disappears from the list.
 */

/** A title as the browser receives it: plain text, or a key in a client locale namespace. */
export type FileUsageText =
  | string
  | {
      readonly key: string;
      readonly ns?: string;
      readonly defaultValue?: string;
    };

/**
 * Which disk a feature stores new files on.
 *
 * - `{ name }`: always this disk.
 * - `{ default: true }`: the application's default disk, `drive.default`.
 * - `{ config }`: the disk a configuration key names, such as `knowledge.disk`; the default disk when it is empty.
 */
export type FileUsageDisk =
  | { readonly name: string }
  | { readonly default: true }
  | { readonly config: string };

/**
 * How a stored file is downloaded.
 *
 * - `authenticated`: through the plugin's own routes, which require a signed-in caller with permission.
 * - `public`: through a public content URL, such as the one `defineFileRepositoryApiRoutes` serves under
 *   `accessPath`; anyone holding the URL can download the file.
 */
export type FileUsageDownload = 'authenticated' | 'public';

export interface FileUsageDefinition {
  /** Unique across the application, such as `projects.attachments`. */
  readonly id: string;
  readonly title: FileUsageText;
  /** The package that owns the feature; omitted for the application's own. */
  readonly plugin?: string;
  /** The file Collection, with the columns `FILE_COLUMNS` lists. */
  readonly collection: string;
  readonly connection?: string;
  readonly disk: FileUsageDisk;
  readonly download: FileUsageDownload;
}

/** A registered feature with its disk resolved against the current configuration. */
export interface FileUsageDescription {
  readonly id: string;
  readonly title: FileUsageText;
  readonly plugin: string | null;
  readonly collection: string;
  readonly connection: string | null;
  /** The disk new files go to now. */
  readonly disk: string;
  /** How `disk` was chosen: a fixed name, the default disk, or a configuration key. */
  readonly diskSource: 'name' | 'default' | 'config';
  /** The configuration key, when `diskSource` is `config`. */
  readonly configPath: string | null;
  /** Whether `disk` is the default disk because the feature follows it, directly or through an empty key. */
  readonly followsDefault: boolean;
  readonly download: FileUsageDownload;
}

export interface FileUsageConfig {
  get<TValue = unknown>(key: string): TValue | undefined;
}

const DOWNLOADS: readonly FileUsageDownload[] = ['authenticated', 'public'];

export class FileUsageRegistry {
  private readonly entries = new Map<string, FileUsageDefinition>();

  /**
   * Declares a feature that stores files. Declaring the same id again replaces it when it names the same Collection,
   * so a router built twice registers once; an id that already names another Collection is a conflict and throws.
   */
  register(definition: FileUsageDefinition): void {
    validate(definition);
    const existing = this.entries.get(definition.id);
    if (
      existing &&
      (existing.collection !== definition.collection ||
        (existing.connection ?? null) !== (definition.connection ?? null))
    )
      throw new Error(
        `File usage "${definition.id}" is already registered for another Collection.`,
      );
    this.entries.set(definition.id, Object.freeze({ ...definition }));
  }

  list(): readonly FileUsageDefinition[] {
    return [...this.entries.values()];
  }

  /** Every feature with the disk it stores new files on under `config`, in registration order. */
  describe(config: FileUsageConfig | undefined): FileUsageDescription[] {
    const defaultDisk = defaultDiskOf(config);
    return this.list().map((usage) => {
      const base = {
        id: usage.id,
        title: usage.title,
        plugin: usage.plugin ?? null,
        collection: usage.collection,
        connection: usage.connection ?? null,
        download: usage.download,
      };
      if ('name' in usage.disk)
        return {
          ...base,
          disk: usage.disk.name,
          diskSource: 'name',
          configPath: null,
          followsDefault: false,
        };
      if ('config' in usage.disk) {
        const configured = config?.get<unknown>(usage.disk.config);
        const named =
          typeof configured === 'string' && configured.trim() !== ''
            ? configured
            : undefined;
        return {
          ...base,
          disk: named ?? defaultDisk,
          diskSource: 'config',
          configPath: usage.disk.config,
          followsDefault: named === undefined,
        };
      }
      return {
        ...base,
        disk: defaultDisk,
        diskSource: 'default',
        configPath: null,
        followsDefault: true,
      };
    });
  }
}

/** The application's default disk, `drive.default`; `local` when the application configures no Drive. */
export function defaultDiskOf(config: FileUsageConfig | undefined): string {
  const drive = config?.get<{ readonly default?: unknown }>('drive');
  return typeof drive?.default === 'string' && drive.default
    ? drive.default
    : 'local';
}

function validate(definition: FileUsageDefinition): void {
  const fail = (field: string): never => {
    throw new Error(`Invalid file usage: ${field}.`);
  };
  if (!definition || typeof definition !== 'object') fail('definition');
  if (typeof definition.id !== 'string' || !definition.id.trim()) fail('id');
  if (
    typeof definition.collection !== 'string' ||
    !definition.collection.trim()
  )
    fail('collection');
  if (!DOWNLOADS.includes(definition.download)) fail('download');
  const disk = definition.disk as Record<string, unknown> | undefined;
  if (!disk || typeof disk !== 'object') fail('disk');
  else if ('name' in disk) {
    if (typeof disk.name !== 'string' || !disk.name) fail('disk.name');
  } else if ('config' in disk) {
    if (typeof disk.config !== 'string' || !disk.config) fail('disk.config');
  } else if (disk.default !== true) fail('disk');
  const title = definition.title as unknown;
  if (
    !(typeof title === 'string' && title) &&
    !(
      title &&
      typeof title === 'object' &&
      typeof (title as { key?: unknown }).key === 'string'
    )
  )
    fail('title');
}
