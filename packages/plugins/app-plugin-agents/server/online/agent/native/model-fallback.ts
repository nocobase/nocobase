import {
  wrapLanguageModel,
  type LanguageModel,
  type LanguageModelMiddleware,
} from 'ai';
import { ModelError } from '../../gateway.js';

type StreamWrapper = NonNullable<LanguageModelMiddleware['wrapStream']>;
type StreamResult = Awaited<ReturnType<StreamWrapper>>;
type StreamPart =
  StreamResult['stream'] extends ReadableStream<infer Part> ? Part : never;

function commitsResponse(part: StreamPart): boolean {
  switch (part.type) {
    case 'stream-start':
    case 'response-metadata':
    case 'raw':
    case 'text-start':
    case 'text-end':
    case 'reasoning-start':
    case 'reasoning-end':
      return false;
    case 'text-delta':
    case 'reasoning-delta':
      return part.delta.length > 0;
    default:
      // A tool may already have caused an effect. A finish can carry billable usage.
      return true;
  }
}

/** Keep protocol markers private until there is visible content, a tool event, or a finish. */
async function initialResponse(result: StreamResult): Promise<StreamResult> {
  const reader = result.stream.getReader();
  const prelude: StreamPart[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done)
        throw new ModelError(
          'network',
          'The model stream closed before responding.',
        );
      if (part.value.type === 'error') throw part.value.error;
      prelude.push(part.value);
      if (commitsResponse(part.value)) break;
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
    throw error;
  }
  let emitted = 0;
  return {
    ...result,
    stream: new ReadableStream<StreamPart>({
      async pull(controller) {
        if (emitted < prelude.length) {
          controller.enqueue(prelude[emitted++]);
          if (emitted === prelude.length) prelude.length = 0;
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
          params.abortSignal?.throwIfAborted();
          backup = wrapLanguageModel({ model: replacement, middleware: [] });
          return backup.doStream(params);
        }
      },
    },
  });
}
