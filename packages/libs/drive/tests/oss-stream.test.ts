import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { expect, it } from 'vitest';

it.each(['initial', 'refresh', 'credentials-fail'])(
  'survives file and upstream stream errors during %s credentials resolution',
  async (phase) => {
    const { stdout, stderr } = await promisify(execFile)(
      process.execPath,
      [
        '--import',
        'tsx',
        fileURLToPath(
          new URL('./fixtures/oss-stream-failure.mjs', import.meta.url),
        ),
        phase,
      ],
      { cwd: fileURLToPath(new URL('../../../../', import.meta.url)) },
    );
    expect(stdout).toContain('Process survived');
    expect(stderr).toBe('');
  },
);
