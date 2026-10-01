// @vitest-environment node
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { promptHidden } from '../src/cli/auth/input.ts';
import { HubCliError } from '../src/errors.ts';

/** A terminal on standard input: raw mode is recorded, and what the test writes arrives as typed keys. */
let terminal: PassThrough & {
  isTTY: boolean;
  setRawMode: ReturnType<typeof vi.fn>;
};
let stdin: PropertyDescriptor | undefined;

beforeEach(() => {
  terminal = Object.assign(new PassThrough(), {
    isTTY: true,
    setRawMode: vi.fn(),
  });
  stdin = Object.getOwnPropertyDescriptor(process, 'stdin');
  Object.defineProperty(process, 'stdin', {
    value: terminal,
    configurable: true,
  });
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
});
afterEach(() => {
  if (stdin) Object.defineProperty(process, 'stdin', stdin);
  vi.restoreAllMocks();
});

describe('promptHidden', () => {
  it('reads one line, applying backspace, and restores the terminal', async () => {
    const answer = promptHidden('API key: ');
    terminal.write('abx\u007fc\r');
    await expect(answer).resolves.toBe('abc');
    expect(terminal.setRawMode.mock.calls).toEqual([[true], [false]]);
  });

  it('cancels on Ctrl-C with the exit code of an interrupted command, saving nothing', async () => {
    const answer = promptHidden('API key: ');
    terminal.write('abc\u0003');
    const error: unknown = await answer.catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(HubCliError);
    expect(error).toMatchObject({ code: 'LOGIN_CANCELLED', exitCode: 130 });
    expect(terminal.setRawMode).toHaveBeenLastCalledWith(false);
  });
});
