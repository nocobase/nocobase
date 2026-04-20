import type {GeneratedOperation} from './generated-command.js';

export interface PostProcessorContext {
  flags: Record<string, unknown>;
  operation: GeneratedOperation;
}

export type PostProcessor = (result: unknown, context: PostProcessorContext) => unknown | Promise<unknown>;

function buildKey(resource: string, action: string) {
  return `${resource}:${action}`;
}

class PostProcessorRegistry {
  private readonly processors = new Map<string, PostProcessor>();

  register(resource: string, action: string, processor: PostProcessor) {
    this.processors.set(buildKey(resource, action), processor);
  }

  resolve(resource?: string, action?: string) {
    if (!resource || !action) {
      return undefined;
    }

    return this.processors.get(buildKey(resource, action));
  }
}

export const postProcessorRegistry = new PostProcessorRegistry();

export async function applyPostProcessor(result: unknown, context: PostProcessorContext) {
  const processor = postProcessorRegistry.resolve(context.operation.logicalResourceName, context.operation.actionName);
  if (!processor) {
    return result;
  }

  return processor(result, context);
}
