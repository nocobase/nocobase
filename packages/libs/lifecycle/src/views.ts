import type { LifecycleDescription } from './definition.js';
import { toMermaid } from './mermaid.js';
import type { LifecycleRuntime, RecordView } from './runtime.js';

/** What a lifecycle's description route answers: the definition, its parameters and its diagram. */
export interface LifecycleDescriptionView {
  readonly description: LifecycleDescription;
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Mermaid source of the state diagram. */
  readonly diagram: string;
}

/** What a fire answers: the record afterwards, and whether it was a replay. */
export interface FireView extends RecordView {
  readonly replayed: boolean;
}

/** The description a page draws a lifecycle from, as `GET <lifecycle>/lifecycle` answers it. */
export function lifecycleDescriptionView(
  runtime: LifecycleRuntime,
  name: string,
): LifecycleDescriptionView {
  const description = runtime.describe(name);
  return {
    description,
    parameters: runtime.parameters(name) as Readonly<Record<string, unknown>>,
    diagram: toMermaid(description),
  };
}
