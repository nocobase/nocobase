// @vitest-environment jsdom
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ModelEntriesEditor } from '../../client/components/model-entries.js';
import { type ModelSuggestionRunner } from '../../client/lib/model-suggestions.js';
import locales from '../../client/locales/index.js';
import {
  newEntryDraft,
  type EntryDraft,
} from '../../client/pages/agents/agent-model.js';
import type { RunnerSummary } from '../../shared/runners.js';
import { runner } from './fixtures.js';

const NS = '@nocobase/app-plugin-agents';
const MODEL = 'openai/gpt-6-sol';

function reportingRunner(
  id: string,
  name: string,
): RunnerSummary & ModelSuggestionRunner {
  return {
    ...runner(id, { name }),
    tools: [
      {
        kind: 'pi',
        authenticated: true,
        modelsDetectionStatus: 'detected',
        models: [{ id: MODEL, efforts: ['low', 'high'] }],
      },
    ],
  };
}

function Editor({
  runners,
  initial,
  save,
}: {
  readonly runners?: readonly RunnerSummary[];
  readonly initial: EntryDraft;
  readonly save: (entries: readonly EntryDraft[]) => void;
}): ReactElement {
  const [entries, setEntries] = useState([initial]);
  return (
    <>
      <ModelEntriesEditor
        idPrefix='models'
        type='runner'
        value={entries}
        runners={runners}
        onChange={setEntries}
      />
      <button onClick={() => save(entries)}>Save configuration</button>
    </>
  );
}

describe('model suggestions in the Agent editor', () => {
  it.each([
    {
      locale: 'en-US',
      modelLabel: 'Model',
      source: '2 runtimes available',
      hint: /Runtime model reports are suggestions/,
      effortLabel: 'Reasoning effort',
      reported: 'Reported efforts: low, high.',
    },
    {
      locale: 'zh-CN',
      modelLabel: '模型',
      source: '2 台执行机可用',
      hint: /执行机上报的模型仅供建议/,
      effortLabel: '推理强度',
      reported: '上报的思考强度：low, high。',
    },
  ])(
    'offers a reported Pi model, its reporting machines and efforts in $locale',
    async ({ locale, modelLabel, source, hint, effortLabel, reported }) => {
      const runtime = await createTestI18nRuntime({
        locale,
        namespaces: { [NS]: locales },
      });
      const save = vi.fn();
      const user = userEvent.setup();
      render(
        <TestI18nProvider runtime={runtime} namespace={NS}>
          <Editor
            runners={[
              reportingRunner('office', 'Office'),
              reportingRunner('laptop', 'Laptop'),
            ]}
            initial={newEntryDraft({ tool: 'pi' })}
            save={save}
          />
        </TestI18nProvider>,
      );
      expect(screen.getByText(hint)).toBeVisible();
      const input = screen.getByRole('combobox', { name: modelLabel });
      await user.click(input);
      await user.type(input, MODEL);
      const option = await screen.findByRole('option', {
        name: new RegExp(MODEL),
      });
      await user.hover(within(option).getByText(source));
      expect(await screen.findByText(/Office ·/)).toBeVisible();
      expect(screen.getByText(/Laptop ·/)).toBeVisible();
      await user.unhover(within(option).getByText(source));
      await user.keyboard('{ArrowDown}{Enter}');
      expect(input).toHaveValue(MODEL);
      expect(save).not.toHaveBeenCalled();
      expect(screen.getByText(reported)).toBeVisible();
      await user.click(screen.getByRole('combobox', { name: effortLabel }));
      const efforts = await screen.findAllByRole('option');
      expect(efforts).toHaveLength(3);
      await user.keyboard('{Escape}');
      await user.click(
        screen.getByRole('button', { name: 'Save configuration' }),
      );
      expect(save).toHaveBeenCalledWith([
        expect.objectContaining({ tool: 'pi', model: MODEL, effort: '' }),
      ]);
    },
  );

  it('lists built-in models on one line in a popup at least as wide as a model id needs', async () => {
    const runtime = await createTestI18nRuntime({
      namespaces: { [NS]: locales },
    });
    const user = userEvent.setup();
    render(
      <TestI18nProvider runtime={runtime} namespace={NS}>
        <Editor initial={newEntryDraft({ tool: 'claude' })} save={vi.fn()} />
      </TestI18nProvider>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Model' }));
    const option = await screen.findByRole('option', {
      name: /claude-opus-5-5/,
    });
    const id = within(option).getByText('claude-opus-5-5');
    expect(id).toHaveAttribute('title', 'claude-opus-5-5');
    expect(id).toHaveClass('truncate');
    expect(within(option).getByText('Built-in')).toHaveAttribute(
      'data-slot',
      'badge',
    );
    expect(option.closest('[data-slot="combobox-content"]')).toHaveClass(
      'min-w-72',
    );
    await user.click(option);
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveValue(
      'claude-opus-5-5',
    );
  });

  it('keeps an existing model and effort when a report arrives, and keeps manual input possible', async () => {
    const runtime = await createTestI18nRuntime({
      namespaces: { [NS]: locales },
    });
    const save = vi.fn();
    const initial = newEntryDraft({
      tool: 'pi',
      model: MODEL,
      effort: 'xhigh',
    });
    const view = render(
      <TestI18nProvider runtime={runtime} namespace={NS}>
        <Editor initial={initial} save={save} />
      </TestI18nProvider>,
    );
    view.rerender(
      <TestI18nProvider runtime={runtime} namespace={NS}>
        <Editor
          runners={[reportingRunner('office', 'Office')]}
          initial={initial}
          save={save}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveValue(MODEL);
    expect(
      screen.getByText(/The saved effort xhigh was not reported/),
    ).toBeVisible();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: 'Save configuration' }),
    );
    expect(save).toHaveBeenLastCalledWith([
      expect.objectContaining({ model: MODEL, effort: 'xhigh' }),
    ]);
    const input = screen.getByRole('combobox', { name: 'Model' });
    await user.clear(input);
    await user.type(input, 'private/custom-model');
    await user.keyboard('{Escape}');
    await user.click(
      screen.getByRole('combobox', { name: 'Reasoning effort' }),
    );
    expect(await screen.findAllByRole('option')).toHaveLength(7);
    await user.keyboard('{Escape}');
    await user.click(
      screen.getByRole('button', { name: 'Save configuration' }),
    );
    expect(save).toHaveBeenLastCalledWith([
      expect.objectContaining({
        model: 'private/custom-model',
        effort: 'xhigh',
      }),
    ]);
  });
});
