import type { WorkflowRunOptions } from '../server/instructions/run/instruction.js';
import type { WorkflowHandlerContext } from '../shared/handler-context.js';

export type WorkflowHandlerFunction<
  TContext = WorkflowHandlerContext,
  TResult = unknown,
> = (context: TContext, options: WorkflowRunOptions) => TResult;

const handlerMetadata: unique symbol = Symbol('workflow.handler.metadata');
declare const handlerType: unique symbol;

export interface DefinedHandler<
  T extends WorkflowHandlerFunction<never> = WorkflowHandlerFunction<never>,
> {
  readonly [handlerMetadata]: true;
  /** Carries the signature for inference without loading the implementation. */
  readonly [handlerType]?: T;
  readonly module: string;
}

export function defineHandler<T extends WorkflowHandlerFunction<never>>(
  module: string,
): DefinedHandler<T> {
  if (!/^\.\/[\w/-]+(?:\.js)?$/.test(module) || module.includes('..'))
    throw new TypeError('Handler module must be a package-relative path');
  const normalizedModule = module.endsWith('.js')
    ? module.slice(0, -3)
    : module;
  return Object.freeze({
    [handlerMetadata]: true as const,
    module: normalizedModule,
  });
}

export function handlerModule(
  handler: Pick<DefinedHandler, typeof handlerMetadata | 'module'>,
): string {
  if (!handler || handler[handlerMetadata] !== true)
    throw new TypeError('Handler must be created with defineHandler');
  return handler.module;
}

export type HandlerContext<T extends WorkflowHandlerFunction<never>> =
  Parameters<T> extends [] ? unknown : Parameters<T>[0];
