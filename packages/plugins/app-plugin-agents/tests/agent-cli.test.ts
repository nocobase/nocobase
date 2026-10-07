import { describe, expect, it } from 'vitest';

import { resolveAgentCli } from '../server/core/runs/index.js';

describe('resolveAgentCli', () => {
  it('names the CLI after the application when the configuration leaves it out', () => {
    expect(resolveAgentCli(undefined, { id: 'acme' })).toEqual({
      name: 'acme',
      package: { kind: 'served' },
      credentialFile: '.acme/run.json',
    });
  });

  it('takes what the configuration names', () => {
    expect(
      resolveAgentCli(
        { name: 'acme', package: { kind: 'preinstalled' } },
        { id: 'acme' },
      ),
    ).toEqual({
      name: 'acme',
      package: { kind: 'preinstalled' },
      credentialFile: '.acme/run.json',
    });
    expect(
      resolveAgentCli({ credentialFile: '.cli/token.json' }, { id: 'acme' })
        .credentialFile,
    ).toBe('.cli/token.json');
  });
});
