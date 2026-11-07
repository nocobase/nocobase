// @vitest-environment jsdom
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';

import locales from '../../client/locales/index.js';
import { GoodAtTemplates } from '../../client/pages/agents/good-at-templates.js';

function Draft() {
  const [value, setValue] = useState('');
  return (
    <>
      <label>
        Description
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <GoodAtTemplates value={value} onChange={setValue} />
    </>
  );
}

it.each(['en-US', 'zh-CN'])(
  'selects every template and restores exact drafts in %s',
  async (locale) => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'agents', resources: locales },
      locale,
      strict: true,
    });
    const user = userEvent.setup();
    render(
      <TestI18nProvider runtime={runtime} namespace='agents'>
        <Draft />
      </TestI18nProvider>,
    );
    const t = runtime.getFixedT('agents');
    const input = screen.getByRole('textbox', { name: 'Description' });
    const trigger = screen.getByRole('button', {
      name: t('goodAtTemplates.fill'),
    });
    const select = async (key: string) => {
      trigger.focus();
      await user.keyboard('{ArrowDown}');
      expect(await screen.findAllByRole('menuitem')).toHaveLength(6);
      await user.click(
        screen.getByRole('menuitem', {
          name: t(`goodAtTemplates.${key}`),
          exact: true,
        }),
      );
      expect(input).toHaveValue(t(`modelSuggestions.${key}`));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    };
    const undo = async (expected: string) => {
      await user.click(
        screen.getByRole('button', {
          name: t('goodAtTemplates.undo'),
          exact: true,
        }),
      );
      expect(input).toHaveValue(expected);
      expect(
        screen.queryByRole('button', {
          name: t('goodAtTemplates.undo'),
          exact: true,
        }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    };
    for (const key of [
      'design',
      'large',
      'review',
      'routine',
      'small',
      'explanation',
    ]) {
      await select(key);
      await undo('');
    }
    const original = '  Original description\n原文  ';
    await user.type(input, original);
    await select('review');
    await user.type(input, ' + manual edit');
    await undo(original);
    await select('routine');
    await select('large');
    await undo(t('modelSuggestions.routine'));
  },
);
