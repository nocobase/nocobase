// @vitest-environment node
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';
import { agentsEmbedding } from '../server/indexing/embedding.js';

// This is a deterministic missing-optional-module simulation, not an isolated registry installation.
vi.mock('@nocobase/app-plugin-agents/server/tokens', () => {
  throw Object.assign(new Error('Optional Agents package is absent.'), {
    code: 'ERR_MODULE_NOT_FOUND',
  });
});
it('keeps Knowledge usable when importing the optional Agents token module fails', async () => {
  expect(await agentsEmbedding(new ServiceContainer())).toBeNull();
});
