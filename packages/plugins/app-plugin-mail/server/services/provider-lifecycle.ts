export function finalizeStream(
  stream: ReadableStream<Uint8Array>,
  finalize: () => Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let finalized = false;
  const finish = async (): Promise<void> => {
    if (finalized) return;
    finalized = true;
    reader.releaseLock();
    await finalize();
  };
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await reader.read();
        if (result.done) {
          controller.close();
          await finish();
        } else {
          controller.enqueue(result.value);
        }
      } catch (error) {
        controller.error(error);
        await finish();
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        await finish();
      }
    },
  });
}

export async function closeAdapter(adapter: {
  close?(): Promise<void>;
}): Promise<void> {
  try {
    await adapter.close?.();
  } catch {
    // Provider cleanup cannot change the result of a completed command.
  }
}
