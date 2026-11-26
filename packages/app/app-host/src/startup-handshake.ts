import type { ChildProcess } from 'node:child_process';
import { IPC_CHANNEL } from './ipc-channel.ts';

/** Readiness belongs to this child and launch session, never to an unrelated HTTP listener on the same port. */
export function waitForHostListening(
  child: ChildProcess,
  session: string,
  timeoutMs: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('exit', onExit);
      child.off('error', onError);
      child.off('disconnect', onExit);
    };
    const fail = (error: Error): void => {
      cleanup();
      reject(error);
    };
    const onMessage = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      const message = value as Record<string, unknown>;
      if (message.channel !== IPC_CHANNEL || message.session !== session)
        return;
      if (message.kind === 'startup-error') {
        const code =
          typeof message.code === 'string' ? message.code : undefined;
        fail(
          Object.assign(
            new Error(`App host startup failed${code ? `: ${code}` : ''}`),
            { code },
          ),
        );
      } else if (message.kind === 'listening') {
        if (
          typeof message.port !== 'number' ||
          !Number.isInteger(message.port) ||
          message.port < 1 ||
          message.port > 65535
        ) {
          fail(new Error('App host reported an invalid listening port'));
          return;
        }
        cleanup();
        resolve(message.port);
      }
    };
    const onExit = (): void =>
      fail(new Error('App host child exited before listening'));
    const onError = (error: Error): void => fail(error);
    const timer = setTimeout(
      () =>
        fail(
          new Error(
            `App host did not report its listening port within ${timeoutMs}ms`,
          ),
        ),
      timeoutMs,
    );
    timer.unref?.();
    child.on('message', onMessage);
    child.once('exit', onExit);
    child.once('error', onError);
    child.once('disconnect', onExit);
  });
}

/** Wait for delivery before a failed child exits. A disconnected parent does not make shutdown fail. */
export async function reportHostStartup(
  result: { port: number } | { error: unknown },
): Promise<void> {
  const session = process.env.APP_HOST_SESSION;
  if (!session || !process.send || !process.connected) return;
  const message =
    'port' in result
      ? { kind: 'listening', port: result.port }
      : {
          kind: 'startup-error',
          code: (result.error as NodeJS.ErrnoException | null)?.code,
        };
  await new Promise<void>((resolve) => {
    try {
      process.send!({ channel: IPC_CHANNEL, session, ...message }, () =>
        resolve(),
      );
    } catch {
      resolve();
    }
  });
}
