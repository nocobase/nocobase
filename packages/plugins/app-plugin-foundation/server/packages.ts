import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Reads the manifests of the packages the application resolves, the way Node resolves a bare specifier from the
 * application's root: `node_modules/<name>` in that directory and in each one above it. Reading from the application
 * rather than from this plugin or the process's working directory reports what the application actually runs, which
 * is also what a deployment that starts elsewhere has installed.
 */
export class InstalledPackages {
  private readonly manifests = new Map<
    string,
    Promise<{ readonly name: string; readonly version: string } | undefined>
  >();

  public constructor(private readonly rootDir: string) {}

  /** The installed version of a package, or `undefined` when the application does not resolve it. */
  public async version(name: string): Promise<string | undefined> {
    return (await this.manifest(name))?.version;
  }

  /** The application's own package name, from its `package.json`. */
  public async applicationName(): Promise<string | undefined> {
    const manifest = await readManifest(
      path.join(this.rootDir, 'package.json'),
    );
    return manifest?.name;
  }

  private manifest(
    name: string,
  ): Promise<{ readonly name: string; readonly version: string } | undefined> {
    // Installed versions do not change while the process runs, so each is read once.
    let pending = this.manifests.get(name);
    if (!pending) {
      pending = this.find(name);
      this.manifests.set(name, pending);
    }
    return pending;
  }

  private async find(
    name: string,
  ): Promise<{ readonly name: string; readonly version: string } | undefined> {
    let directory = this.rootDir;
    for (;;) {
      const manifest = await readManifest(
        path.join(directory, 'node_modules', name, 'package.json'),
      );
      if (manifest?.name === name && manifest.version) {
        return { name, version: manifest.version };
      }
      const parent = path.dirname(directory);
      if (parent === directory) return undefined;
      directory = parent;
    }
  }
}

async function readManifest(
  file: string,
): Promise<{ readonly name?: string; readonly version?: string } | undefined> {
  try {
    const manifest = JSON.parse(await readFile(file, 'utf8')) as unknown;
    if (typeof manifest !== 'object' || manifest === null) return undefined;
    const { name, version } = manifest as Record<string, unknown>;
    return {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof version === 'string' ? { version } : {}),
    };
  } catch {
    return undefined;
  }
}
