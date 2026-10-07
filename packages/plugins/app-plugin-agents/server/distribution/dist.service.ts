/**
 * Distribution: the runner (`nocobase-runner`) and the application's CLI (such as `acme`), served by the application
 * itself as standalone tarballs (one per target, each bundling Node), so nothing is published to a registry and a
 * machine needs nothing installed.
 *
 * `nocobase cli build` of `@nocobase/app-cli` (`--runner` for the runner) builds each product into a directory of its
 * own, with its own manifest, so the products are built and mounted apart (in CI, one artifact each):
 *
 *   <dir>/<channel>/<product>/manifest.json
 *   <dir>/<channel>/<product>/<version>/<product>-v<version>-<target>.tar.gz
 *
 * where a product's manifest lists its versions with each target's file (relative to the product's directory),
 * SHA-256 and size. The application serves one channel (`agents.dist.channel`, `stable` by default); a product's
 * current version is the one `agents.dist.versions` pins, or the highest the channel has. Only files a manifest lists
 * are ever served.
 */
import { createReadStream, type ReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import {
  compareVersions,
  DIST_PRODUCT_PATTERN,
  DIST_ROUTES,
  DIST_TARGET_PATTERN,
  ProtocolError,
  routePath,
  type DistArtifact,
  type DistManifest,
} from '@nocobase/agent-protocol';
import { z } from 'zod';

import { notFound } from '../kernel/errors.js';

/** `agents.dist` in the application's configuration. */
export interface DistConfig {
  /** Where the built tarballs are; `storage/runners/dist` of the application by default. */
  readonly dir?: string;
  /** Which channel to serve: `stable` by default. */
  readonly channel?: string;
  /** A version to serve per product instead of the channel's highest, such as `{ acme: '0.3.1' }`. */
  readonly versions?: Readonly<Record<string, string>>;
}

export const DEFAULT_CHANNEL = 'stable';

const StoredTargetSchema = z.object({
  file: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/u),
  size: z.number().int().nonnegative(),
});

const StoredVersionsSchema = z.record(
  z.string(),
  z.object({ targets: z.record(z.string(), StoredTargetSchema) }),
);

/** The manifest of one product, `<channel>/<product>/manifest.json`, with files relative to the product's directory. */
const ProductManifestSchema = z.object({
  schema: z.literal(1),
  product: z.string().regex(DIST_PRODUCT_PATTERN),
  bin: z.string().optional(),
  versions: StoredVersionsSchema,
});

/** Every product's manifest of the channel, with files relative to the channel's directory. */
interface StoredManifest {
  readonly products: Record<
    string,
    { bin?: string; versions: z.infer<typeof StoredVersionsSchema> }
  >;
}

/** A file the application may serve, found through the manifest. */
export interface DistFile {
  /** The platform it is built for. */
  readonly target: string;
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
  open(): ReadStream;
}

export interface DistService {
  readonly channel: string;
  /** What the channel serves now; empty when nothing was built. */
  manifest(): Promise<DistManifest>;
  /** The current `product` for `target`, or null. */
  find(product: string, target: string): Promise<DistArtifact | null>;
  /** Like `find`, but 404: `PLATFORM_UNSUPPORTED` with the targets there are, or `NOT_FOUND` for no such product. */
  resolve(product: string, target: string): Promise<DistArtifact>;
  /** A file the manifest lists (any version on the channel); 404 otherwise. */
  file(product: string, version: string, name: string): Promise<DistFile>;
}

export function createDistService(config: DistConfig = {}): DistService {
  const channel = config.channel ?? DEFAULT_CHANNEL;
  const channelDir =
    config.dir === undefined ? null : path.resolve(config.dir, channel);
  let cache: { key: string; manifest: StoredManifest } | undefined;

  /** Each product's manifest file with its modification time, or nothing when there is none. */
  const manifestFiles = async (): Promise<
    { file: string; product: string; mtimeMs: number }[]
  > => {
    if (channelDir === null) return [];
    const found: { file: string; product: string; mtimeMs: number }[] = [];
    let entries: string[];
    try {
      entries = (await readdir(channelDir)).sort();
    } catch {
      return found;
    }
    for (const product of entries) {
      if (!DIST_PRODUCT_PATTERN.test(product)) continue;
      const file = path.join(channelDir, product, 'manifest.json');
      try {
        found.push({ file, product, mtimeMs: (await stat(file)).mtimeMs });
      } catch {
        // A product not built yet.
      }
    }
    return found;
  };

  const readManifest = async (file: string): Promise<unknown> => {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as unknown;
    } catch {
      return undefined;
    }
  };

  const load = async (): Promise<StoredManifest | null> => {
    const files = await manifestFiles();
    if (files.length === 0) {
      cache = undefined;
      return null;
    }
    const key = files
      .map((entry) => `${entry.file}:${entry.mtimeMs}`)
      .join('|');
    if (cache?.key === key) return cache.manifest;
    const merged: StoredManifest = { products: {} };
    for (const entry of files) {
      const raw = await readManifest(entry.file);
      const product = entry.product;
      const parsed = ProductManifestSchema.safeParse(raw);
      if (!parsed.success || parsed.data.product !== product) {
        console.error(
          `Agents: ${entry.file} is not the distribution manifest of ${product}.`,
        );
        continue;
      }
      // Its files are relative to the product's directory; the merged ones are relative to the channel's.
      const versions: StoredManifest['products'][string]['versions'] = {};
      for (const [version, stored] of Object.entries(parsed.data.versions))
        versions[version] = {
          targets: Object.fromEntries(
            Object.entries(stored.targets).map(([target, file]) => [
              target,
              { ...file, file: path.posix.join(product, file.file) },
            ]),
          ),
        };
      merged.products[product] = {
        ...(parsed.data.bin === undefined ? {} : { bin: parsed.data.bin }),
        versions,
      };
    }
    cache = { key, manifest: merged };
    return merged;
  };

  const currentVersion = (
    stored: StoredManifest,
    product: string,
  ): string | null => {
    const versions = Object.keys(stored.products[product]?.versions ?? {});
    const pinned = config.versions?.[product];
    if (pinned !== undefined) return versions.includes(pinned) ? pinned : null;
    return versions.sort(compareVersions).at(-1) ?? null;
  };

  const artifact = (
    stored: StoredManifest,
    product: string,
    target: string,
  ): DistArtifact | null => {
    const version = currentVersion(stored, product);
    if (version === null) return null;
    const entry = stored.products[product]?.versions[version]?.targets[target];
    if (entry === undefined) return null;
    return {
      product,
      version,
      target,
      url: routePath(DIST_ROUTES.file, {
        product,
        version,
        file: path.posix.basename(entry.file),
      }),
      sha256: entry.sha256,
      size: entry.size,
      channel,
    };
  };

  return {
    channel,

    async manifest() {
      const stored = await load();
      const products: Record<string, { version: string; targets: string[] }> =
        {};
      for (const product of Object.keys(stored?.products ?? {})) {
        const version = stored && currentVersion(stored, product);
        if (!stored || version === null) continue;
        products[product] = {
          version,
          targets: Object.keys(
            stored.products[product]?.versions[version]?.targets ?? {},
          ).sort(),
        };
      }
      return { channel, products };
    },

    async find(product, target) {
      const stored = await load();
      return stored ? artifact(stored, product, target) : null;
    },

    async resolve(product, target) {
      if (!DIST_PRODUCT_PATTERN.test(product)) throw notFound('Product');
      if (!DIST_TARGET_PATTERN.test(target))
        throw new ProtocolError(
          'PLATFORM_UNSUPPORTED',
          `${target} is not a platform name such as darwin-arm64 or linux-x64.`,
        );
      const stored = await load();
      const found = stored ? artifact(stored, product, target) : null;
      if (found) return found;
      const version = stored ? currentVersion(stored, product) : null;
      if (!stored || version === null)
        throw new ProtocolError(
          'NOT_FOUND',
          `This application serves no ${product} on the ${channel} channel. Build it with nocobase cli build.`,
        );
      const targets = Object.keys(
        stored.products[product]?.versions[version]?.targets ?? {},
      ).sort();
      throw new ProtocolError(
        'PLATFORM_UNSUPPORTED',
        `${product} ${version} is not built for ${target}; it is for ${targets.join(', ') || 'no platform'}.`,
        { targets },
      );
    },

    async file(product, version, name) {
      const stored = await load();
      const targets = stored?.products[product]?.versions[version]?.targets;
      const found = Object.entries(targets ?? {}).find(
        ([, candidate]) => path.posix.basename(candidate.file) === name,
      );
      if (!found || channelDir === null) throw notFound('File');
      const [target, entry] = found;
      const file = path.resolve(channelDir, entry.file);
      if (!file.startsWith(`${channelDir}${path.sep}`)) throw notFound('File');
      let size: number;
      try {
        size = (await stat(file)).size;
      } catch {
        throw notFound('File');
      }
      return {
        target,
        path: file,
        sha256: entry.sha256,
        size,
        open: () => createReadStream(file),
      };
    },
  };
}
