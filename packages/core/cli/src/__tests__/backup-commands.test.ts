/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const TEST_DIRS: string[] = [];

const mocks = vi.hoisted(() => ({
  getCurrentEnvName: vi.fn(),
  getEnv: vi.fn(),
  listEnvs: vi.fn(),
  loadRuntimeSync: vi.fn(),
  updateEnvRuntime: vi.fn(),
  commandOutput: vi.fn(),
  waitForAppReady: vi.fn(),
  startTask: vi.fn(),
  updateTask: vi.fn(),
  stopTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  announceTargetEnv: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  crossEnvConfirm: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  listEnvs: mocks.listEnvs,
}));

vi.mock('../lib/runtime-store.js', () => ({
  loadRuntimeSync: mocks.loadRuntimeSync,
}));

vi.mock('../lib/bootstrap.js', () => ({
  updateEnvRuntime: mocks.updateEnvRuntime,
}));

vi.mock('../lib/run-npm.js', () => ({
  commandOutput: mocks.commandOutput,
}));

vi.mock('../lib/app-health.js', () => ({
  waitForAppReady: mocks.waitForAppReady,
}));

vi.mock('../lib/ui.js', () => ({
  announceTargetEnv: mocks.announceTargetEnv,
  startTask: mocks.startTask,
  updateTask: mocks.updateTask,
  stopTask: mocks.stopTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  isInteractiveTerminal: mocks.isInteractiveTerminal,
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.crossEnvConfirm,
}));

function createCommandHarness(
  parseResult: { args?: Record<string, any>; flags?: Record<string, any> },
  argv: string[] = [],
) {
  return {
    argv,
    parse: vi.fn(async () => ({
      args: parseResult.args ?? {},
      flags: parseResult.flags ?? {},
    })),
    config: {},
    error: (message: string) => {
      throw new Error(message);
    },
    log: vi.fn(),
  };
}

function setTerminalInteractivity(value: boolean) {
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
  const stdoutWindowSizeDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'getWindowSize');
  const stderrWindowSizeDescriptor = Object.getOwnPropertyDescriptor(process.stderr, 'getWindowSize');

  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, 'getWindowSize', {
    configurable: true,
    value: () => [120, 40],
  });
  Object.defineProperty(process.stderr, 'getWindowSize', {
    configurable: true,
    value: () => [120, 40],
  });

  return () => {
    if (stdinDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor);
    }
    if (stdoutDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor);
    }
    if (stdoutWindowSizeDescriptor) {
      Object.defineProperty(process.stdout, 'getWindowSize', stdoutWindowSizeDescriptor);
    }
    if (stderrWindowSizeDescriptor) {
      Object.defineProperty(process.stderr, 'getWindowSize', stderrWindowSizeDescriptor);
    }
  };
}

function createTempDir(prefix: string) {
  const directory = mkdtempSync(path.join(os.tmpdir(), prefix));
  TEST_DIRS.push(directory);
  return directory;
}

beforeEach(() => {
  mocks.getCurrentEnvName.mockResolvedValue('local');
  mocks.getEnv.mockImplementation(async (envName?: string) => ({
    name: envName ?? 'local',
    runtime: {
      version: 'runtime-v1',
    },
    baseUrl: 'http://127.0.0.1:13000/api',
    appPort: 13000,
  }));
  mocks.listEnvs.mockResolvedValue({
    lastEnv: 'local',
    envs: {
      e2e: {},
    },
  });
  mocks.loadRuntimeSync.mockReturnValue({
    version: 'runtime-v1',
    generatedAt: '2026-05-20T00:00:00.000Z',
    commands: [],
  });
  mocks.updateEnvRuntime.mockResolvedValue({
    version: 'runtime-v2',
    generatedAt: '2026-05-20T00:00:00.000Z',
    commands: [
      { commandId: 'backup create' },
      { commandId: 'backup status' },
      { commandId: 'backup download' },
      { commandId: 'backup restore-upload' },
    ],
  });
  mocks.commandOutput.mockResolvedValue('');
  mocks.waitForAppReady.mockResolvedValue(undefined);
  mocks.crossEnvConfirm.mockResolvedValue(true);
  mocks.isInteractiveTerminal.mockReturnValue(true);
});

afterEach(() => {
  vi.resetAllMocks();
  for (const directory of TEST_DIRS.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('resolveBackupTargetEnv points empty workspaces to nb init --ui', async () => {
  const { resolveBackupTargetEnv } = await import('../lib/backup.js');
  mocks.getEnv.mockResolvedValue(undefined);
  mocks.listEnvs.mockResolvedValue({
    lastEnv: undefined,
    envs: {},
  });

  await expect(resolveBackupTargetEnv()).rejects.toThrow(/No env is configured\. Run `nb init --ui` first\./);
});

test('resolveBackupTargetEnv explains how to initialize a missing requested env', async () => {
  const { resolveBackupTargetEnv } = await import('../lib/backup.js');
  mocks.getEnv.mockResolvedValue(undefined);

  await expect(resolveBackupTargetEnv('prod')).rejects.toThrow(/Run `nb init --ui --env prod` first\./);
});

test('backup create refreshes runtime automatically and downloads to the current directory by default', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-create-');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);

  try {
    const { default: BackupCreate } = await import('../commands/backup/create.js');

    mocks.commandOutput
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            name: 'base.nbdata',
            inProgress: true,
          },
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            'base.nbdata': {
              inProgress: false,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            output: path.join(cwd, 'base.nbdata'),
          },
        }),
      );

    const command = createCommandHarness(
      {
        flags: {
          env: 'e2e',
          yes: false,
        },
      },
      ['--env', 'e2e'],
    );

    await BackupCreate.prototype.run.call(command);

    expect(mocks.updateEnvRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        envName: 'e2e',
        configFile: expect.stringContaining('nocobase-ctl.config.json'),
      }),
    );
    expect(mocks.commandOutput).toHaveBeenCalledTimes(3);
    expect(mocks.commandOutput.mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining([
        expect.stringContaining(path.join('bin', 'run.js')),
        'api',
        'backup',
        'create',
        '--env',
        'e2e',
        '--yes',
        '--json-output',
      ]),
    );
    expect(mocks.commandOutput.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        env: expect.objectContaining({
          NB_SKIP_STARTUP_UPDATE: '1',
          _NOCO_CLI_TSX_CHILD: '',
        }),
      }),
    );
    expect(mocks.commandOutput.mock.calls[1]?.[1]).toEqual(
      expect.arrayContaining([
        'api',
        'backup',
        'status',
        '--name',
        'base.nbdata',
        '--env',
        'e2e',
        '--yes',
        '--json-output',
      ]),
    );
    expect(mocks.commandOutput.mock.calls[2]?.[1]).toEqual(
      expect.arrayContaining([
        'api',
        'backup',
        'download',
        '--name',
        'base.nbdata',
        '--output',
        path.join(cwd, 'base.nbdata'),
        '--env',
        'e2e',
        '--yes',
        '--json-output',
      ]),
    );
    expect(mocks.succeedTask).toHaveBeenCalledWith(`Backup saved to ${path.join(cwd, 'base.nbdata')}`);
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup create treats an existing output path as a destination directory', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-output-');
  const outputDir = path.join(cwd, 'fixtures');
  mkdirSync(outputDir, { recursive: true });
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);

  try {
    const { default: BackupCreate } = await import('../commands/backup/create.js');

    mocks.commandOutput
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            name: 'fixture.nbdata',
            inProgress: false,
          },
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            output: path.join(outputDir, 'fixture.nbdata'),
          },
        }),
      );

    const command = createCommandHarness({
      flags: {
        output: './fixtures',
      },
    });

    await BackupCreate.prototype.run.call(command);

    expect(mocks.commandOutput).toHaveBeenCalledTimes(2);
    expect(mocks.commandOutput.mock.calls[1]?.[1]).toEqual(
      expect.arrayContaining([
        'api',
        'backup',
        'download',
        '--output',
        path.join(outputDir, 'fixture.nbdata'),
        '--json-output',
      ]),
    );
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup create supports --json-output and suppresses progress text', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-json-');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);

  try {
    const { default: BackupCreate } = await import('../commands/backup/create.js');

    mocks.commandOutput
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            name: 'json-backup.nbdata',
            inProgress: false,
          },
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          data: {
            output: path.join(cwd, 'json-backup.nbdata'),
          },
        }),
      );

    const command = createCommandHarness(
      {
        flags: {
          env: 'e2e',
          yes: true,
          'json-output': true,
        },
      },
      ['--env', 'e2e', '--yes', '--json-output'],
    );

    await BackupCreate.prototype.run.call(command);

    expect(mocks.updateEnvRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        envName: 'e2e',
        quiet: true,
      }),
    );
    expect(mocks.announceTargetEnv).not.toHaveBeenCalled();
    expect(mocks.startTask).not.toHaveBeenCalled();
    expect(mocks.updateTask).not.toHaveBeenCalled();
    expect(mocks.succeedTask).not.toHaveBeenCalled();
    expect(mocks.failTask).not.toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(command.log.mock.calls[0]?.[0] ?? '')).toEqual({
      env: 'e2e',
      name: 'json-backup.nbdata',
      output: path.join(cwd, 'json-backup.nbdata'),
    });
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup create times out when the remote backup never finishes', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-timeout-');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  const dateNowSpy = vi.spyOn(Date, 'now');

  try {
    const { BACKUP_CREATE_TIMEOUT_MS } = await import('../lib/backup.js');
    const { default: BackupCreate } = await import('../commands/backup/create.js');

    mocks.commandOutput.mockResolvedValueOnce(
      JSON.stringify({
        data: {
          name: 'stuck.nbdata',
          inProgress: true,
        },
      }),
    );

    dateNowSpy.mockReturnValueOnce(0);
    dateNowSpy.mockReturnValueOnce(BACKUP_CREATE_TIMEOUT_MS + 1);

    const command = createCommandHarness({
      flags: {},
    });

    await expect(BackupCreate.prototype.run.call(command)).rejects.toThrow(
      /Backup "stuck\.nbdata" did not finish in time for "local"\. Waited 600s but it still reports `inProgress: true`\./,
    );
    expect(mocks.commandOutput).toHaveBeenCalledTimes(1);
    expect(mocks.failTask).toHaveBeenCalledWith('Failed to create backup for "local".');
  } finally {
    dateNowSpy.mockRestore();
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup restore asks for confirmation when --force is omitted', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-restore-confirm-');
  const backupFile = path.join(cwd, 'base.nbdump');
  writeFileSync(backupFile, 'backup');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  const { default: BackupRestore } = await import('../commands/backup/restore.js');
  const command = createCommandHarness({
    flags: {
      file: './base.nbdump',
      force: false,
    },
  });

  try {
    mocks.commandOutput.mockResolvedValueOnce(
      JSON.stringify({
        data: {
          success: true,
        },
      }),
    );

    await BackupRestore.prototype.run.call(command);

    expect(mocks.crossEnvConfirm).toHaveBeenCalledWith({
      message: `Restore backup "${backupFile}" into "local"? This will overwrite application data.`,
      default: false,
    });
    expect(mocks.commandOutput).toHaveBeenCalledTimes(1);
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup restore returns early when interactive confirmation is declined', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-restore-decline-');
  const backupFile = path.join(cwd, 'base.nbdump');
  writeFileSync(backupFile, 'backup');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  const { default: BackupRestore } = await import('../commands/backup/restore.js');
  const command = createCommandHarness({
    flags: {
      file: './base.nbdump',
      force: false,
    },
  });

  try {
    mocks.crossEnvConfirm.mockResolvedValueOnce(false);

    await BackupRestore.prototype.run.call(command);

    expect(mocks.commandOutput).not.toHaveBeenCalled();
    expect(mocks.waitForAppReady).not.toHaveBeenCalled();
    expect(mocks.crossEnvConfirm).toHaveBeenCalledWith({
      message: `Restore backup "${backupFile}" into "local"? This will overwrite application data.`,
      default: false,
    });
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup restore requires --force in non-interactive mode', async () => {
  const restoreTty = setTerminalInteractivity(false);
  const cwd = createTempDir('nocobase-cli-backup-restore-noninteractive-');
  const backupFile = path.join(cwd, 'base.nbdump');
  writeFileSync(backupFile, 'backup');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  const { default: BackupRestore } = await import('../commands/backup/restore.js');
  const command = createCommandHarness({
    flags: {
      file: './base.nbdump',
      force: false,
    },
  });

  try {
    mocks.isInteractiveTerminal.mockReturnValue(false);
    await expect(BackupRestore.prototype.run.call(command)).rejects.toThrow(
      /needs confirmation.*Re-run with `--force` to restore .*base\.nbdump into "local" in non-interactive mode\./i,
    );
    expect(mocks.commandOutput).not.toHaveBeenCalled();
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});

test('backup restore uploads the file and waits for the app to become ready', async () => {
  const restoreTty = setTerminalInteractivity(true);
  const cwd = createTempDir('nocobase-cli-backup-restore-');
  const backupFile = path.join(cwd, 'base.nbdump');
  writeFileSync(backupFile, 'backup');
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);

  try {
    const { default: BackupRestore } = await import('../commands/backup/restore.js');

    mocks.loadRuntimeSync.mockReturnValue({
      version: 'runtime-v1',
      generatedAt: '2026-05-20T00:00:00.000Z',
      commands: [{ commandId: 'backup restore-upload' }],
    });
    mocks.commandOutput.mockResolvedValueOnce(
      JSON.stringify({
        data: {
          success: true,
        },
      }),
    );

    const command = createCommandHarness(
      {
        flags: {
          env: 'e2e',
          yes: true,
          file: './base.nbdump',
          force: true,
        },
      },
      ['--env', 'e2e', '--yes', '--file', './base.nbdump', '--force'],
    );

    await BackupRestore.prototype.run.call(command);

    expect(mocks.updateEnvRuntime).not.toHaveBeenCalled();
    expect(mocks.commandOutput).toHaveBeenCalledTimes(1);
    expect(mocks.commandOutput.mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining([
        'api',
        'backup',
        'restore-upload',
        '--file',
        backupFile,
        '--force',
        '--env',
        'e2e',
        '--yes',
      ]),
    );
    expect(mocks.commandOutput.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        env: expect.objectContaining({
          NB_SKIP_STARTUP_UPDATE: '1',
          _NOCO_CLI_TSX_CHILD: '',
        }),
      }),
    );
    expect(mocks.waitForAppReady).toHaveBeenCalledWith({
      envName: 'e2e',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
    });
    expect(mocks.succeedTask).toHaveBeenCalledWith(`Backup restored for "e2e" from ${backupFile}`);
  } finally {
    cwdSpy.mockRestore();
    restoreTty();
  }
});
