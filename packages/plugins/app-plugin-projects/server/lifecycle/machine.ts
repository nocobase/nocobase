/**
 * A compiled definition: what the application asks about states and moves. Event transitions (`on`) are never an
 * ordinary move: `canTransition` and `allowedMoves` leave them out, and `eventTarget` answers for them.
 */
import {
  ANY_STATE,
  type LifecycleDefinition,
  type LifecycleState,
} from './definition.js';

export interface LifecycleMachine {
  readonly definition: LifecycleDefinition;
  /** In definition order. */
  readonly states: readonly LifecycleState[];
  isKnown(key: string): boolean;
  category(key: string): string | null;
  /**
   * Whether `actor` may move a record from `from` to `to`. `to` must be a state of this definition; `from` need not
   * be (a record that came from another definition), in which case only transitions from `*` apply.
   */
  canTransition(from: string, to: string, actor: string): boolean;
  /** The states `actor` may move a record in `from` to, in definition order. */
  allowedMoves(from: string, actor: string): readonly string[];
  /** Where `event` takes a record in `from`, or null when no event transition leaves `from` on it. */
  eventTarget(from: string, event: string): string | null;
}

const matches = (pattern: string, key: string) =>
  pattern === ANY_STATE || pattern === key;

export function compile(definition: LifecycleDefinition): LifecycleMachine {
  const byKey = new Map(definition.states.map((state) => [state.key, state]));
  const keys = definition.states.map((state) => state.key);

  /** `from → to` pairs per actor, with `from` possibly outside the definition only through `*`. */
  const allowed = (from: string, to: string, actor: string) =>
    from !== to &&
    byKey.has(to) &&
    definition.transitions.some(
      (transition) =>
        transition.on === undefined &&
        transition.actors.includes(actor) &&
        matches(transition.from, from) &&
        matches(transition.to, to),
    );

  return {
    definition,
    states: definition.states,
    isKnown: (key) => byKey.has(key),
    category: (key) => byKey.get(key)?.category ?? null,
    canTransition: allowed,
    allowedMoves: (from, actor) =>
      keys.filter((to) => allowed(from, to, actor)),
    eventTarget: (from, event) =>
      definition.transitions.find(
        (transition) => transition.on === event && transition.from === from,
      )?.to ?? null,
  };
}
