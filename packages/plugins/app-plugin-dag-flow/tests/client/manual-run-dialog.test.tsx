/** @vitest-environment jsdom */

import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ManualRunDialog } from '../../client/workflow-management/pages.js';
import { workflowApi } from '../../client/workflow-management/data.js';
import type { WorkflowRunRecord } from '../../client/workflow-management/types.js';
import clientLocales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';

const { toaster } = vi.hoisted(() => ({
  toaster: { show: vi.fn(), close: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useToaster: () => toaster,
}));
const i18n = await createWorkflowI18nRuntime(clientLocales);
afterEach(() => vi.restoreAllMocks());

describe('manual run submission', () => {
  it.each([false, true])(
    'disables repeated submissions and handles failure=%s',
    async (failure) => {
      const request = Promise.withResolvers<WorkflowRunRecord>();
      const execute = vi
        .spyOn(workflowApi, 'execute')
        .mockReturnValue(request.promise);
      const onExecuted = vi.fn();
      const onClose = vi.fn();
      render(
        <I18nProvider runtime={i18n}>
          <ManualRunDialog
            workflow={
              { id: 'workflow-1', inputSchema: { type: 'object' } } as never
            }
            onClose={onClose}
            onExecuted={onExecuted}
          />
        </I18nProvider>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Run' }));
      const pending = screen.getByRole('button', { name: 'Running…' });
      expect(pending.hasAttribute('disabled')).toBe(true);
      fireEvent.click(pending);
      expect(execute).toHaveBeenCalledTimes(1);
      expect(onExecuted).not.toHaveBeenCalled();
      await act(async () => {
        if (failure) request.reject(new Error('Submission failed'));
        else
          request.resolve({ id: 'run-1', status: null } as WorkflowRunRecord);
      });
      if (failure) {
        await waitFor(() =>
          expect(
            screen
              .getByRole('button', { name: 'Run' })
              .hasAttribute('disabled'),
          ).toBe(false),
        );
        expect(onExecuted).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(toaster.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            description: 'Submission failed',
          }),
        );
      } else {
        expect(onExecuted).toHaveBeenCalledWith({ id: 'run-1', status: null });
        expect(onClose).toHaveBeenCalledOnce();
      }
    },
  );
});
