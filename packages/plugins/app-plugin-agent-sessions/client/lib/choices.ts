import type { SessionChoice } from '../../shared/api.js';

const ORDER: readonly string[] = ['model', 'thought_level', 'model_config'];

/** The categories the composer's bar shows, each by its icon; the agent's other choices wait in its "more" menu. */
const ON_BAR: readonly string[] = [...ORDER, 'mode'];

/** The choices the composer displays, including fixed values: model and reasoning first, the mode last. */
export function offeredChoices(
  choices: readonly SessionChoice[] = [],
): SessionChoice[] {
  const rank = (choice: SessionChoice): number => {
    if (choice.category === 'mode') return ORDER.length + 1;
    const index = ORDER.indexOf(choice.category ?? '');
    return index === -1 ? ORDER.length : index;
  };
  return choices
    .filter((choice) => choice.options.length > 0)
    .sort((a, b) => rank(a) - rank(b));
}

/** The name of a choice's value, or the value itself for one the agent no longer lists. */
export function valueName(choice: SessionChoice, value: string): string {
  return choice.options.find((option) => option.value === value)?.name ?? value;
}

/** Whether the composer shows the choice on its bar rather than in its "more" menu. */
export function onBar(choice: SessionChoice): boolean {
  return ON_BAR.includes(choice.category ?? '');
}
