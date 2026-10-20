import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ReviewerReferenceSelect } from '../client/components/reviewer-reference-select.js';
import type { ParameterApi } from '../client/lib/parameter-api.js';
import enUS from '../client/locales/en-US.js';
import { NAMESPACE } from '../client/lib/format.js';

it('queries only after typing, pages matches and selects a newly returned user', async () => {
  const runtime = await createTestI18nRuntime({
    locale: 'en-US',
    namespaces: { [NAMESPACE]: { 'en-US': async () => ({ default: enUS }) } },
  });
  const references = vi
    .fn<ParameterApi['references']>()
    .mockImplementation(async (_type, _q, page) => ({
      data: [{ id: `new-${page}`, name: `New Person ${page}` }],
      meta: { page, pageSize: 10, total: 11 },
    }));
  const reference = vi
    .fn<ParameterApi['reference']>()
    .mockResolvedValue({ id: 'chen', name: 'Chen' });
  const change = vi.fn();
  const api = { references, reference } as unknown as ParameterApi;
  render(
    <TestI18nProvider runtime={runtime} namespace={NAMESPACE}>
      <ReviewerReferenceSelect
        api={api}
        type='user'
        value='chen'
        disabled={false}
        onChange={change}
      />
    </TestI18nProvider>,
  );
  const input = screen.getByRole('combobox');
  await waitFor(() => expect(reference).toHaveBeenCalledWith('user', 'chen'));
  fireEvent.focus(input);
  expect(references).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'New' } });
  await waitFor(() =>
    expect(references).toHaveBeenCalledWith('user', 'New', 1),
  );
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(
    await screen.findByRole('option', { name: 'New Person 1' }),
  ).toBeDefined();
  fireEvent.click(screen.getByText('Next page'));
  await waitFor(() =>
    expect(references).toHaveBeenCalledWith('user', 'New', 2),
  );
  fireEvent.click(await screen.findByRole('option', { name: 'New Person 2' }));
  expect(change).toHaveBeenCalledWith('new-2');
});
