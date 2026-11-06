// Archives the deployment build as `storage/exports/dist.tar.gz`, for `pnpm build --tar`.
//
// The archive holds `dist/` as a directory rather than its contents, so extracting it anywhere produces a `dist/`
// alongside `config.example.yml` — the same two paths a deployment starts from, in the same relative positions they
// have in the application. Extracting into a directory that already holds work therefore adds a `dist/` rather than
// scattering `server/`, `client/`, and `node_modules/` across it.
//
// `config.example.yml` travels with it because a deployment has to write a `config.yml` before it can start, and the
// example is the only statement of what that file may contain. It is the one file outside `dist/` that a server needs.
//
// The application's `Dockerfile` and `Dockerfile.dockerignore` travel with it too when the application has them, so a
// server builds the image from the archive alone (`docker build --build-arg DIST=prebuilt .` in the extracted
// directory), without the sources or a registry.
//
// Uses the `tar` package rather than the `tar` command. A build runs on macOS, Linux, and Windows, whose tars are
// bsdtar, GNU tar, and a bundled bsdtar, and their `--exclude` patterns are anchored differently — a pattern that
// excludes the right paths on one can silently exclude nothing on another. `filter` is a callback, so what it matches
// does not depend on which tar the machine happens to have.
import fs from 'node:fs';
import path from 'node:path';

import { create } from 'tar';

import { formatMegabytes } from './server-deps.mjs';

const rootDir = path.resolve(process.env.NOCOBASE_TOOL_ROOT || process.cwd());
const distDir = path.join(rootDir, 'dist');
const storageDir = path.join(rootDir, 'storage', 'exports');
const archivePath = path.join(storageDir, 'dist.tar.gz');

/** What the archive holds, relative to the application root and in the order they appear in it. */
const ARCHIVE_ENTRIES = ['config.example.yml', 'dist'];
/** What it also holds when the application has it: what building the image from the archive needs. */
const OPTIONAL_ENTRIES = ['Dockerfile', 'Dockerfile.dockerignore'];

/**
 * Directories of executable shims, excluded because they do not survive the trip.
 *
 * A `.bin` entry is a symlink into a sibling package, or on Windows a shell script holding a path resolved on the
 * machine that installed it. Neither is meaningful once the tree is extracted somewhere else, and a dangling symlink
 * is worse than an absent one: `pnpm install` in the extracted tree reports a corrupt store rather than repairing it.
 *
 * `clean-dist-bin.mjs` already removes these before the archive is built, and nothing between the two puts one back —
 * `retarget-native.mjs` fetches binaries and renames extracted tarballs without running an install. This is the
 * guarantee rather than the cleanup: a step added later that does install into `dist` would otherwise reintroduce
 * them, and the resulting archive would fail only on a deployment.
 */
const isShimDirectory = (entryPath) => entryPath.split('/').includes('.bin');

if (!fs.existsSync(distDir)) {
  throw new Error('Missing dist. Run pnpm build first.');
}

const missing = ARCHIVE_ENTRIES.filter(
  (entry) => !fs.existsSync(path.join(rootDir, entry)),
);
if (missing.length > 0) {
  throw new Error(`Missing ${missing.join(', ')} in the application root.`);
}

fs.mkdirSync(storageDir, { recursive: true });
fs.rmSync(archivePath, { force: true });

// `sync` rather than the promise this returns without it. On a tree this size that promise never settles: the
// archive is written, the event loop drains with it still pending, and Node exits on the unsettled await — leaving a
// plausible-looking file that `tar -tzf` cannot read to the end. A truncated archive that reports success is the
// worst outcome available here, and the synchronous path costs about eight seconds.
create(
  {
    cwd: rootDir,
    file: archivePath,
    filter: (entryPath) => !isShimDirectory(entryPath),
    gzip: true,
    sync: true,
  },
  [
    ...OPTIONAL_ENTRIES.filter((entry) =>
      fs.existsSync(path.join(rootDir, entry)),
    ),
    ...ARCHIVE_ENTRIES,
  ],
);

console.log(
  `Packed ${path.relative(rootDir, archivePath)} (${formatMegabytes(fs.statSync(archivePath).size)}).`,
);
