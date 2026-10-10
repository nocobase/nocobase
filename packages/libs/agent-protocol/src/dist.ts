/**
 * Distribution: the application serves the agent runner and its own CLI itself (`DIST_ROUTES`), as tarballs that either
 * bundle Node, one per target, or carry none and run on the machine's own Node.js 24 or newer, one for every target
 * (`UNIVERSAL_TARGET`). Neither is published to a registry. The install script, the runner's self-update and the
 * runner's CLI installs all read the same answers.
 */
import { z } from 'zod';

/**
 * A platform as the tarballs name it: `<os>-<arch>` with Node's names, such as `darwin-arm64` or `linux-x64`
 * (`process.platform` and `process.arch`).
 */
export const DIST_TARGET_PATTERN: RegExp = /^[a-z0-9]+-[a-z0-9]+$/u;

/**
 * The key a product's manifest lists its platform-independent tarball under: one package without a bundled Node that
 * runs on the machine's own Node.js 24 or newer. It is served to any target that has no tarball of its own, and the
 * answer then names the target that was asked for and sets `universal` (`DistArtifact.universal`). Not a target name
 * (`DIST_TARGET_PATTERN`): nobody asks for it.
 */
export const UNIVERSAL_TARGET = 'universal';

/** A product the application serves, by its command name: the runner (`RUNNER_PRODUCT`) or the application's CLI, such as `acme`. */
export const DIST_PRODUCT_PATTERN: RegExp = /^[a-z][a-z0-9-]{0,63}$/u;

/**
 * The runner's own product, `nocobase-runner` (`@nocobase/agent-runner`), served beside the application's CLI. A runner
 * reports the product it runs as (`RegisterRequest.product`), which the application compares updates against.
 */
export const RUNNER_PRODUCT = 'nocobase-runner';

/** The target of the machine this code runs on. */
export function currentTarget(
  platform: string = process.platform,
  arch: string = process.arch,
): string {
  return `${platform}-${arch}`;
}

/** One tarball of one product version for one target. */
export interface DistArtifact {
  readonly product: string;
  readonly version: string;
  readonly target: string;
  /** Where to download it: a path on the application's origin (`DIST_ROUTES.file`), sent with the same credential. */
  readonly url: string;
  readonly sha256: string;
  readonly size: number;
  /** The channel the application serves (`stable` unless configured). */
  readonly channel: string;
  /**
   * True when the tarball is the platform-independent one (`UNIVERSAL_TARGET`): it carries no Node, so the machine
   * needs Node.js 24 or newer of its own. Absent for a tarball built for `target`, which bundles its Node.
   */
  readonly universal?: boolean;
}

export const DistArtifactSchema: z.ZodType<DistArtifact> = z.object({
  product: z.string().regex(DIST_PRODUCT_PATTERN),
  version: z.string().min(1).max(64),
  target: z.string().regex(DIST_TARGET_PATTERN),
  url: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/u),
  size: z.number().int().nonnegative(),
  channel: z.string().min(1),
  universal: z.boolean().optional(),
});

/** What the application serves now: each product's current version and the targets it was built for. */
export interface DistManifest {
  readonly channel: string;
  readonly products: Readonly<
    Record<
      string,
      {
        readonly version: string;
        readonly targets: readonly string[];
      }
    >
  >;
}

export const DistManifestSchema: z.ZodType<DistManifest> = z.object({
  channel: z.string(),
  products: z.record(
    z.string(),
    z.object({ version: z.string(), targets: z.array(z.string()) }),
  ),
});

/**
 * Compares two versions by their dotted numbers, then a release above its pre-releases, then pre-release identifiers
 * as semver orders them. -1, 0 or 1. Build metadata (`+…`) is ignored. Only used to tell whether an update is newer;
 * compatibility is decided by features, never by versions.
 */
export function compareVersions(a: string, b: string): number {
  const split = (value: string) => {
    const [core = '', pre] = value.replace(/\+.*$/u, '').split(/-(.*)/su);
    return {
      core: core.split('.').map((part) => Number.parseInt(part, 10) || 0),
      pre: pre === undefined || pre === '' ? [] : pre.split('.'),
    };
  };
  const left = split(a);
  const right = split(b);
  for (let i = 0; i < Math.max(left.core.length, right.core.length); i += 1) {
    const diff = (left.core[i] ?? 0) - (right.core[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  if (left.pre.length === 0 || right.pre.length === 0) {
    if (left.pre.length === right.pre.length) return 0;
    return left.pre.length === 0 ? 1 : -1;
  }
  for (let i = 0; i < Math.max(left.pre.length, right.pre.length); i += 1) {
    const x = left.pre[i];
    const y = right.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const xn = /^\d+$/u.test(x);
    const yn = /^\d+$/u.test(y);
    if (xn && yn) {
      const diff = Number(x) - Number(y);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    } else if (xn !== yn) return xn ? -1 : 1;
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
