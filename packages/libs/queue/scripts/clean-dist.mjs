import { rm } from 'node:fs/promises';

// Removed backend output must not survive a rebuild and reach the OSS tarball.
await rm(new URL('../dist', import.meta.url), { force: true, recursive: true });
