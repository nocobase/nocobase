import { mockDatabase } from '@nocobase/database';
import { vi } from 'vitest';
import Application, { ApplicationOptions } from '../application';

const mockServer = (options?: ApplicationOptions) => {
  return new Application({
    database: mockDatabase(),
    acl: false,
    ...options,
  });
};

describe('app command', () => {
  let app: Application;

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  beforeEach(async () => {
    app = mockServer();
    await app.runCommand('install');
  });

  it('should test command should handle by IPC Server or not', () => {
    app.command('testaa').ipc();
    app.command('testbb');

    expect(app.cli.parseHandleByIPCServer(['node', 'cli', 'nocobase', 'testaa'])).toBeTruthy();
    expect(app.cli.parseHandleByIPCServer(['node', 'cli', 'nocobase', 'testbb'])).toBeFalsy();
  });

  it('should test sub command should handle by IPC Server or not', () => {
    const subParent = app.command('subparent');
    subParent.command('testaa').ipc();
    subParent.command('testbb');

    expect(app.cli.parseHandleByIPCServer(['node', 'cli', 'nocobase', 'subparent', 'testaa'])).toBeTruthy();
    expect(app.cli.parseHandleByIPCServer(['node', 'cli', 'nocobase', 'subparent', 'testbb'])).toBeFalsy();
  });

  it('should correctly parse the command multiple times with varying parameters', async () => {
    const fn = vi.fn();

    app
      .command('test1')
      .option('-a, --aaa <aaa>', 'aaa option')
      .action((options) => {
        fn(options);
      });

    await app.runCommand('test1', '-a', 'aaa');
    expect(fn).toBeCalledWith({ aaa: 'aaa' });

    await app.runCommand('test1');
    expect(fn).toBeCalledWith({});
  });
});
