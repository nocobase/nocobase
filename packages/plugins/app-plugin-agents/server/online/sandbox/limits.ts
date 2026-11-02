export const sandboxLimits: Readonly<
  Record<
    | 'skillBytes'
    | 'filesystemBytes'
    | 'durationMs'
    | 'shellOutput'
    | 'modelOutput',
    number
  >
> = Object.freeze({
  skillBytes: 5 * 1024 * 1024,
  // Historical aggregate budget: 5 MiB Skill mount + 1 MiB nominal scratch + 1 MiB overhead.
  filesystemBytes: 7 * 1024 * 1024,
  durationMs: 10000,
  shellOutput: 1024 * 1024,
  modelOutput: 24000,
});
export function clip(value: string): string {
  return value.length > sandboxLimits.modelOutput
    ? value.slice(0, sandboxLimits.modelOutput) + '\n[Output truncated]'
    : value;
}
export async function responseText(
  response: Response,
  signal?: AbortSignal,
): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let cancellation: Promise<void> | undefined;
  const cancel = () => (cancellation ??= reader.cancel(signal?.reason));
  const onAbort = () => {
    void cancel().catch(() => {});
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    signal?.throwIfAborted();
    for (;;) {
      const part = await reader.read();
      signal?.throwIfAborted();
      if (part.done) break;
      chunks.push(part.value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    signal?.removeEventListener('abort', onAbort);
    try {
      await cancel();
    } finally {
      reader.releaseLock();
    }
  }
}
