import {
  wrapLanguageModel,
  type LanguageModel,
  type LanguageModelMiddleware,
} from 'ai';

type StreamWrapper = NonNullable<LanguageModelMiddleware['wrapStream']>;
type StreamResult = Awaited<ReturnType<StreamWrapper>>;
type StreamPart =
  StreamResult['stream'] extends ReadableStream<infer Part> ? Part : never;

/** Inspect only the initial protocol prelude. A visible result or a tool call commits the model. */
async function initialResponse(result: StreamResult): Promise<StreamResult> {
  const reader = result.stream.getReader();
  const prelude: StreamPart[] = [];
  try {
    while (prelude.length < 4) {
      const part = await reader.read();
      if (part.done) break;
      if (part.value.type === 'error') throw part.value.error;
      prelude.push(part.value);
      if (
        part.value.type !== 'stream-start' &&
        part.value.type !== 'response-metadata'
      )
        break;
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
    throw error;
  }
  return {
    ...result,
    stream: new ReadableStream<StreamPart>({
      async pull(controller) {
        if (prelude.length) {
          controller.enqueue(prelude.shift()!);
          return;
        }
        try {
          const part = await reader.read();
          if (part.done) {
            reader.releaseLock();
            controller.close();
          } else controller.enqueue(part.value);
        } catch (error) {
          reader.releaseLock();
          controller.error(error);
        }
      },
      async cancel(reason) {
        try {
          await reader.cancel(reason);
        } finally {
          reader.releaseLock();
        }
      },
    }),
  };
}

/** Retry the first text-only model call once, before the SDK can consume any text or tool instructions. */
export function nativeModelFallback(
  model: LanguageModel,
  recover: (error: unknown) => Promise<LanguageModel | undefined>,
): LanguageModel {
  if (typeof model === 'string') return model;
  let started = false;
  let backup: ReturnType<typeof wrapLanguageModel> | undefined;
  return wrapLanguageModel({
    model,
    middleware: {
      specificationVersion: 'v4',
      async wrapStream({ doStream, params }) {
        if (backup) return backup.doStream(params);
        if (started) return doStream();
        started = true;
        try {
          return await initialResponse(await doStream());
        } catch (error) {
          if (params.abortSignal?.aborted) throw error;
          const replacement = await recover(error);
          if (!replacement || typeof replacement === 'string') throw error;
          backup = wrapLanguageModel({ model: replacement, middleware: [] });
          return backup.doStream(params);
        }
      },
    },
  });
}
