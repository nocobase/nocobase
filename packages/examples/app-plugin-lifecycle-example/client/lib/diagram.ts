import type { RecordDetail } from './api.js';

/** A state's id in the diagram, as `toMermaid()` writes it. */
function stateId(state: string): string {
  return state.replace(/[^A-Za-z0-9_]/g, '_');
}

/**
 * The lifecycle's diagram with the record's place in it: the state it is in
 * filled, and the states it has passed through outlined. The colours are
 * fixed rather than theme tokens because Mermaid writes them into the SVG,
 * and the amber reads on both the light and the dark theme.
 */
export function highlightDiagram(
  diagram: string,
  current: string | undefined,
  visited: readonly string[] = [],
): string {
  const lines = [diagram.trimEnd()];
  const passed = [...new Set(visited)].filter((state) => state !== current);
  if (passed.length) {
    lines.push('  classDef visited stroke:#f59e0b,stroke-width:2px');
    lines.push(`  class ${passed.map(stateId).join(',')} visited`);
  }
  if (current) {
    lines.push(
      '  classDef current fill:#f59e0b,stroke:#b45309,color:#1c1917,font-weight:bold',
    );
    lines.push(`  class ${stateId(current)} current`);
  }
  return `${lines.join('\n')}\n`;
}

/** Every state the record has been in, from its transition log. */
export function visitedStates(detail: RecordDetail): string[] {
  return detail.history.transitions.flatMap((entry) =>
    entry.from ? [entry.from, entry.to] : [entry.to],
  );
}
