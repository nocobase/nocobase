// @vitest-environment node
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

// The inbox block is generated from the in-app notification plugin's inbox page, a declared dependency. An edit to
// either side alone fails here: change the plugin, then run `node scripts/sync-ui-library-inbox.mjs`.
const repositoryRoot = path.resolve(import.meta.dirname, '../../..');

it('keeps the inbox block in step with the plugin it is generated from', async () => {
  const run = promisify(execFile)(
    process.execPath,
    ['scripts/sync-ui-library-inbox.mjs', '--check'],
    { cwd: repositoryRoot },
  );
  await expect(run).resolves.toMatchObject({
    stdout: expect.stringContaining('up to date') as unknown,
  });
}, 60_000);
