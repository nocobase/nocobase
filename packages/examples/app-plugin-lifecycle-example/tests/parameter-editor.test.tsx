import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ParameterGroupView } from '../shared/parameter-configuration.js';
import type { ParameterApi } from '../client/lib/parameter-api.js';
import { ParameterEditor } from '../client/components/parameter-editor.js';
import { boundParameterGroups } from '../client/components/parameter-binding-editor.js';
import { describeLifecycle } from '@nocobase/lifecycle';
import { expenseLifecycle } from '../server/lifecycles/expense.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import { NAMESPACE } from '../client/lib/format.js';

const group: ParameterGroupView = {
  key: 'expenseThresholds',
  title: 'Expense thresholds',
  revision: 0,
  origin: 'default',
  schemaVersion: 1,
  values: { autoApproveLimit: 100, financeLimit: 1000 },
  canUpdate: true,
  fields: {
    autoApproveLimit: { type: 'number', title: 'Automatic limit' },
    financeLimit: { type: 'number', title: 'Finance limit' },
  },
  uses: [
    {
      lifecycle: 'expenses',
      field: 'financeLimit',
      readMode: 'snapshot',
      bindings: [{ state: 'awaitingManager' }],
    },
  ],
};
async function editor(
  value: ParameterGroupView,
  save: ParameterApi['save'],
  read: ParameterApi['read'] = async () => value,
  locale: 'en-US' | 'zh-CN' = 'en-US',
) {
  const runtime = await createTestI18nRuntime({
    locale,
    namespaces: {
      [NAMESPACE]: {
        'en-US': async () => ({ default: enUS }),
        'zh-CN': async () => ({ default: zhCN }),
      },
    },
  });
  const api: ParameterApi = {
    save,
    read,
    list: async () => [],
    references: async () => ({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0 },
    }),
    reference: async () => null,
    candidates: async () => [],
    history: async () => ({
      snapshot: null,
      usages: [],
      current: {},
      recorded: false,
    }),
  };
  return render(
    <TestI18nProvider runtime={runtime} namespace={NAMESPACE}>
      <ParameterEditor group={value} api={api} actor='zhao' />
    </TestI18nProvider>,
  );
}
describe('shared parameter editor', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'explains timing parameters in business terms in %s',
    async (locale) => {
      const fields = Object.fromEntries(
        Object.keys(enUS.parameters.fields).map((key) => [
          key,
          { type: 'number' as const, title: key },
        ]),
      );
      const value = {
        ...group,
        fields,
        values: Object.fromEntries(Object.keys(fields).map((key) => [key, 3])),
        uses: [],
      };
      await editor(value, async () => value, undefined, locale);
      const copy = locale === 'zh-CN' ? zhCN : enUS;
      for (const field of Object.values(copy.parameters.fields)) {
        expect(screen.getByLabelText(field.title)).toHaveValue(3);
        expect(screen.getByText(field.description)).toBeInTheDocument();
      }
    },
  );

  it('preserves draft inputs on a CAS conflict and explicitly retries against the reviewed revision', async () => {
    const save = vi
      .fn<ParameterApi['save']>()
      .mockRejectedValueOnce({ reason: 'CONFIGURATION_CONFLICT' })
      .mockImplementationOnce(async (_key, values) => ({
        ...group,
        revision: 2,
        values,
      }));
    await editor(group, save, async () => ({
      ...group,
      revision: 1,
      values: { autoApproveLimit: 200, financeLimit: 2000 },
    }));
    fireEvent.change(screen.getByLabelText('Finance limit'), {
      target: { value: '1500' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save values' }));
    expect(
      await screen.findByText(enUS.parameters.conflict),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Finance limit')).toHaveValue(1500);
    expect(save.mock.calls[0]?.slice(0, 3)).toEqual([
      'expenseThresholds',
      { autoApproveLimit: 100, financeLimit: 1500 },
      0,
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: enUS.parameters.keepDraft }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save values' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]?.slice(0, 3)).toEqual([
      'expenseThresholds',
      { autoApproveLimit: 100, financeLimit: 1500 },
      1,
    ]);
    expect(save.mock.calls[1]?.[3]).not.toBe(save.mock.calls[0]?.[3]);
  });
  it('renders read-only values without a write control', async () => {
    const save = vi.fn<ParameterApi['save']>();
    await editor({ ...group, canUpdate: false }, save);
    expect(screen.getByLabelText('Finance limit')).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Save values' }),
    ).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
  it('uses code bindings and leaves unbound diagram entries alone', () => {
    const description = describeLifecycle(expenseLifecycle);
    expect(
      boundParameterGroups(description, 'state', 'awaitingManager'),
    ).toEqual(['expenseThresholds', 'expenseTiming']);
    expect(boundParameterGroups(description, 'transition', 'submit')).toEqual([
      'expenseThresholds',
    ]);
    expect(boundParameterGroups(description, 'state', 'paid')).toEqual([]);
    expect(boundParameterGroups(description, 'transition', 'withdraw')).toEqual(
      [],
    );
  });
});
