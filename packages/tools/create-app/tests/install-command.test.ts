import { afterEach, describe, expect, it, vi } from 'vitest';
import { installDependencies } from '../src/lib/install.ts';
import { CommandFailedError, runCommand } from '../src/lib/run-command.ts';

vi.mock('../src/lib/run-command.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/run-command.ts')>()),
  runCommand: vi.fn(),
}));

afterEach(() => vi.resetAllMocks());

describe('dependency installation registry and diagnostics', () => {
  it('uses project registry settings and user credentials without CLI overrides', async () => {
    vi.mocked(runCommand).mockResolvedValue({ stdout: '', stderr: '' });
    await installDependencies({
      directory: '/project',
      onOutput: vi.fn(),
    });
    expect(runCommand).toHaveBeenCalledWith(
      'pnpm',
      ['install'],
      expect.objectContaining({ cwd: '/project' }),
    );
  });

  it('does not override registry selection when none is provided', async () => {
    vi.mocked(runCommand).mockResolvedValue({ stdout: '', stderr: '' });
    await installDependencies({ directory: '/project' });
    expect(runCommand).toHaveBeenCalledWith(
      'pnpm',
      ['install'],
      expect.any(Object),
    );
  });

  it.each(['ERR_PNPM_FETCH_401', 'ERR_PNPM_FETCH_403', 'ERR_PNPM_NO_AUTH'])(
    'explains stdout-only access denial %s without including credential settings',
    async (code) => {
      vi.mocked(runCommand).mockRejectedValue(
        new CommandFailedError(
          'pnpm',
          1,
          '',
          `[${code}] Access denied\n//registry.example/:_authToken=never-include-this`,
        ),
      );
      const error = await installDependencies({ directory: '/project' }).catch(
        (failure: unknown) => failure,
      );
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(code);
      expect((error as Error).message).toContain('commercial license');
      expect((error as Error).message).toContain(
        'retry pnpm install in the existing project',
      );
      expect((error as Error).message).not.toContain('never-include-this');
    },
  );

  it('retains stable non-authentication pnpm errors', async () => {
    vi.mocked(runCommand).mockRejectedValue(
      new CommandFailedError(
        'pnpm',
        1,
        '',
        '[ERR_PNPM_NO_MATCHING_VERSION] No version was found',
      ),
    );
    await expect(
      installDependencies({ directory: '/project' }),
    ).rejects.toThrow('ERR_PNPM_NO_MATCHING_VERSION');
  });

  it('still reports stderr for failures without a pnpm code', async () => {
    vi.mocked(runCommand).mockRejectedValue(
      new CommandFailedError('pnpm', 1, 'Connection refused'),
    );
    await expect(
      installDependencies({ directory: '/project' }),
    ).rejects.toThrow('Connection refused');
  });
});
