import type { Runner } from '../../shared/runners.js';

/** Detection can report a missing entry for each selected tool instead of an empty list. */
export function noCodingToolsFound(runner: Pick<Runner, 'tools'>): boolean {
  return runner.tools.every((tool) => tool.status === 'notInstalled');
}
