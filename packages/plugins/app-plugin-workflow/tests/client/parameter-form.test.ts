import { afterEach, expect, it, vi } from 'vitest';
import { loadWorkflowParameterForm } from '../../client/workflow-management/parameter-form.js';

vi.mock('@nocobase/app-client', () => ({
  resolveAppUrl: (url: string) => url,
}));
afterEach(() => vi.unstubAllGlobals());

it('requests the exact artifact manifest and does not fall back to current source', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 404 });
  vi.stubGlobal('fetch', fetcher);
  const hash = 'a'.repeat(64);
  await expect(
    loadWorkflowParameterForm(hash, 'workflow.inputForm'),
  ).rejects.toThrow('404');
  expect(fetcher).toHaveBeenCalledExactlyOnceWith(
    `/assets/workflow-artifacts/${hash}/client/manifest.json`,
  );
});

it('rejects a missing artifact identity before requesting resources', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(loadWorkflowParameterForm(null)).rejects.toThrow(
    'hash is missing',
  );
  expect(fetcher).not.toHaveBeenCalled();
});
