import { expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import { WebSearchBudget } from '../server/online/search/budget.js';

const queries = ['one', 'two', 'three', 'four'];
it('reserves synchronously across calls and rejects repeat execution and excess queries', () => {
  const budget = new WebSearchBudget();
  budget.reserve('a', queries);
  budget.reserve('b', queries);
  expect(() => budget.reserve('c', ['ninth'])).toThrow('budget');
  expect(() => budget.reserve('a', queries)).toThrow('already been attempted');
});
it('derives prior attempts from unique original tool calls when approval resumes', () => {
  const message: UIMessage = {
    id: 'assistant',
    role: 'assistant',
    parts: [
      {
        type: 'tool-webSearch',
        toolCallId: 'prior',
        state: 'output-error',
        input: { queries },
        errorText: 'Search failed',
      },
      {
        type: 'tool-webSearch',
        toolCallId: 'prior',
        state: 'output-error',
        input: { queries },
        errorText: 'Duplicate snapshot',
      },
      {
        type: 'tool-webSearch',
        toolCallId: 'pending',
        state: 'input-available',
        input: { queries },
      },
    ],
  };
  const budget = new WebSearchBudget();
  budget.restore(message);
  budget.reserve('pending', queries);
  expect(() => budget.reserve('ninth', ['ninth'])).toThrow('budget');
  expect(() => budget.reserve('prior', queries)).toThrow(
    'already been attempted',
  );
});
it('shares two slots across simultaneous calls and never starts cancelled queued work', async () => {
  const budget = new WebSearchBudget();
  const abort = new AbortController();
  const releases: (() => void)[] = [];
  let started = 0;
  const work = () => {
    started++;
    return new Promise<void>((resolve) => releases.push(resolve));
  };
  const first = budget.run(abort.signal, work);
  const second = budget.run(abort.signal, work);
  const third = budget.run(abort.signal, work);
  const thirdOutcome = (async () => {
    await expect(third).rejects.toThrow('Stopped');
  })();
  expect(started).toBe(2);
  abort.abort(new Error('Stopped'));
  releases.forEach((release) => release());
  await Promise.all([first, second, thirdOutcome]);
  expect(started).toBe(2);
  await budget.run(new AbortController().signal, async () => {
    started++;
  });
  expect(started).toBe(3);
});
