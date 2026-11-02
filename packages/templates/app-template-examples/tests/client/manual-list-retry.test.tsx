import { useState } from 'react';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { resolveListState } from '@nocobase/app-client';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useSettingsData } from '../../client/pages/settings/hooks.js';

import {
  ListFeedback,
  ListFeedbackActions,
} from '../../client/components/list-feedback.js';
import enUS from '../../client/locales/en-US.js';

type Rows = { data: string[] };
const options = {
  namespace: '@nocobase/manual-list-test',
  namespaces: {
    '@nocobase/manual-list-test': {
      'en-US': async () => ({ default: enUS }),
    },
  },
};
function deferred() {
  let resolve!: (value: Rows | Response) => void;
  const promise = new Promise<Rows | Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function failure(status = 500) {
  return new Response(JSON.stringify({ error: { message: 'Unavailable' } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
const adapters = {
  useSettings: (query: string) =>
    useSettingsData<Rows>(`manual-list?q=${query}&page=3&orderBy=title`),
};
function Harness({ kind }: { readonly kind: keyof typeof adapters }) {
  const [query, setQuery] = useState('first');
  const useData = adapters[kind];
  const request = useData(query);
  const state = resolveListState(request, request.data?.data.length ?? 0);
  const useRetryAction = state === 'failed' || state === 'refresh-failed';
  return (
    <>
      <div>
        {useRetryAction ? (
          <ListFeedbackActions
            state={state}
            onRetry={request.reload}
            busy={request.loading}
          />
        ) : (
          <button onClick={request.reload}>Refresh</button>
        )}
        <button onClick={() => setQuery('second')}>Change query</button>
        <ListFeedbackActions state={state} />
      </div>
      <ListFeedback state={state}>
        {request.data?.data.map((row) => (
          <p key={row}>{row}</p>
        ))}
      </ListFeedback>
    </>
  );
}
describe.each(Object.keys(adapters) as (keyof typeof adapters)[])(
  '%s manual list',
  (kind) => {
    it.each(['success', 'failure'] as const)(
      'retains the stale warning during retry until %s',
      async (outcome) => {
        let response: Rows | Response | Promise<Rows | Response> = {
          data: ['Original row'],
        };
        const calls: string[] = [];
        await renderWithApp(<Harness kind={kind} />, {
          ...options,
          fetch: answerApi(({ path, query }) => {
            calls.push(JSON.stringify({ path, query }));
            return response;
          }),
        });
        await screen.findByText('Original row');
        response = failure();
        await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        await screen.findByText(enUS.listFeedback.refreshFailed);
        const pending = deferred();
        response = pending.promise;
        await userEvent.click(
          screen.getByRole('button', { name: 'Retry', exact: true }),
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
          enUS.listFeedback.refreshFailed,
        );
        expect(screen.getByText('Original row')).toBeVisible();
        expect(
          screen.getByRole('button', { name: 'Retrying…' }),
        ).toBeDisabled();
        expect(calls).toHaveLength(3);
        expect(new Set(calls).size).toBe(1);
        await act(async () =>
          pending.resolve(
            outcome === 'success' ? { data: ['Updated row'] } : failure(),
          ),
        );
        if (outcome === 'success') {
          await screen.findByText('Updated row');
          expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        } else {
          await waitFor(() =>
            expect(
              screen.getByRole('button', { name: 'Retry', exact: true }),
            ).toBeEnabled(),
          );
          expect(screen.getByRole('alert')).toHaveTextContent(
            enUS.listFeedback.refreshFailed,
          );
          expect(screen.getByText('Original row')).toBeVisible();
        }
      },
    );
    it.each([401, 403])(
      'hides cached rows through a pending retry after %s',
      async (status) => {
        let response: Rows | Response | Promise<Rows | Response> = {
          data: ['Private row'],
        };
        await renderWithApp(<Harness kind={kind} />, {
          ...options,
          fetch: answerApi(() => response),
        });
        await screen.findByText('Private row');
        response = failure(status);
        await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        await screen.findByText(
          status === 401
            ? enUS.listFeedback.unauthenticated
            : enUS.listFeedback.forbidden,
        );
        expect(screen.queryByText('Private row')).not.toBeInTheDocument();
        const pending = deferred();
        response = pending.promise;
        await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(screen.getByRole('alert')).toHaveTextContent(
          status === 401
            ? enUS.listFeedback.unauthenticated
            : enUS.listFeedback.forbidden,
        );
        expect(screen.queryByText('Private row')).not.toBeInTheDocument();
        await act(async () => pending.resolve({ data: ['Authorized row'] }));
        await screen.findByText('Authorized row');
      },
    );
    it('withholds the previous query and ignores its late retry completion', async () => {
      let response: Rows | Response | Promise<Rows | Response> = {
        data: ['First row'],
      };
      await renderWithApp(<Harness kind={kind} />, {
        ...options,
        fetch: answerApi(() => response),
      });
      await screen.findByText('First row');
      response = failure();
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await screen.findByText(enUS.listFeedback.refreshFailed);
      const old = deferred();
      response = old.promise;
      await userEvent.click(
        screen.getByRole('button', { name: 'Retry', exact: true }),
      );
      const current = deferred();
      response = current.promise;
      await userEvent.click(
        screen.getByRole('button', { name: 'Change query' }),
      );
      expect(screen.getByRole('status')).toHaveTextContent('Loading');
      expect(screen.queryByText('First row')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await act(async () => current.resolve({ data: ['Second row'] }));
      await screen.findByText('Second row');
      await act(async () => old.resolve({ data: ['Obsolete row'] }));
      expect(screen.queryByText('Obsolete row')).not.toBeInTheDocument();
      expect(screen.getByText('Second row')).toBeVisible();
    });
  },
);
