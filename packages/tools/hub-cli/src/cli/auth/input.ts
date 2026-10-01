// Reading a secret without echoing it, and reading one piped in.
import { HubCliError } from '../../errors.ts';

/** Reads all of standard input. */
export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin)
    chunks.push(Buffer.from(chunk as Uint8Array));
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Asks on stderr and reads one line from the terminal with echo off. Stderr, so a `--json` document on stdout stays
 * the only thing there. Input that ends without a line break, such as a terminal that hangs up, answers with what
 * was typed so far, which the caller rejects when it is empty. Ctrl-C cancels with exit code 130, as an interrupted
 * command does in a shell.
 */
export function promptHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  return new Promise((resolve, reject) => {
    let value = '';
    let settled = false;
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      stdin.off('data', onData);
      stdin.off('end', onEnd);
      stdin.off('close', onEnd);
      stdin.off('error', onError);
      if (stdin.isTTY) stdin.setRawMode(false);
      stdin.pause();
      process.stderr.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onEnd = (): void => {
      finish();
    };
    const onError = (error: Error): void => {
      finish(error);
    };
    const onData = (chunk: Buffer): void => {
      for (const character of chunk.toString('utf8')) {
        if (
          character === '\r' ||
          character === '\n' ||
          character === '\u0004'
        ) {
          finish();
          return;
        }
        if (character === '\u0003') {
          finish(
            new HubCliError(
              'LOGIN_CANCELLED',
              'Cancelled; no API key was saved.',
              130,
            ),
          );
          return;
        }
        if (character === '\u007f' || character === '\b')
          value = value.slice(0, -1);
        else value += character;
      }
    };
    process.stderr.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
    stdin.once('end', onEnd);
    stdin.once('close', onEnd);
    stdin.once('error', onError);
  });
}
