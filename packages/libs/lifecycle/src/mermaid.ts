import type { LifecycleDescription } from './definition.js';

export interface MermaidOptions {
  /** Label states and transitions by their titles (the default) or their names. */
  readonly labels?: 'title' | 'name';
}

/** A Mermaid state id: what a state name may hold but Mermaid may not. */
function id(state: string): string {
  return state.replace(/[^A-Za-z0-9_]/g, '_');
}

function label(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').replace(/"/g, "'");
}

/**
 * The lifecycle as a Mermaid state diagram, for documentation or an admin
 * page. Initial states start from `[*]` and final states end there; a
 * transition a trigger fires says which, one an effect continues with
 * names the effect, and one only server code fires is marked ⚙.
 */
export function toMermaid(
  description: LifecycleDescription,
  options: MermaidOptions = {},
): string {
  const byTitle = options.labels !== 'name';
  const lines = ['stateDiagram-v2'];
  for (const state of description.stateInfo)
    if (byTitle && state.title !== state.name)
      lines.push(`  state "${label(state.title)}" as ${id(state.name)}`);
  for (const state of description.initialStates)
    lines.push(`  [*] --> ${id(state)}`);
  for (const transition of description.transitions) {
    const notes: string[] = [];
    if (!transition.manual) notes.push('⚙');
    for (const trigger of description.triggers)
      if (trigger.transition === transition.name)
        notes.push(`⏱ ${trigger.name}`);
    for (const continuation of description.continuations) {
      if (continuation.onSuccess === transition.name)
        notes.push(`✓ ${continuation.effect}`);
      if (continuation.onFailure === transition.name)
        notes.push(`✗ ${continuation.effect}`);
    }
    const text = label(
      [byTitle ? transition.title : transition.name, ...notes].join(' · '),
    );
    for (const from of transition.from)
      for (const to of transition.to)
        lines.push(`  ${id(from)} --> ${id(to)} : ${text}`);
  }
  for (const state of description.stateInfo)
    if (state.final) lines.push(`  ${id(state.name)} --> [*]`);
  return `${lines.join('\n')}\n`;
}
