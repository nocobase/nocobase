import { mkdtemp } from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'node:os';
import { IPCSocketServer } from '../../gateway/ipc-socket-server';
import { IPCSocketClient } from '../../gateway/ipc-socket-client';
import { AppSupervisor } from '../../app-supervisor';

describe('ipc test', () => {
  it('should create ipc socket server', async () => {
    const socketPath = join(await mkdtemp(join(tmpdir(), 'ipc-socket-server')), '/test.sock');
    const socketServer = IPCSocketServer.buildServer(socketPath);

    const client = await IPCSocketClient.getConnection(socketPath);

    const appHandler = vi.fn();

    vi.spyOn(AppSupervisor, 'getInstance').mockImplementation(() => {
      return {
        getApp() {
          return {
            runAsCLI() {
              appHandler();
            },
            cli: {
              hasCommand() {
                return true;
              },
              parseHandleByIPCServer() {
                return true;
              },
            },
          };
        },
      };
    });
    await client.write({ type: 'passCliArgv', payload: { argv: ['node', 'test', 'nocobase'] } });
    expect(appHandler).toHaveBeenCalledTimes(1);
  });
});
