import { vi } from 'vitest';

// Settings pages are rendered here without an application's authorization client, so by default they show every
// control a user granted `manage` sees. A test of a read-only page answers `false` with `vi.mocked(...)`.
vi.mock('../../client/settings-permissions.js', () => ({
  useCanManageAISettings: vi.fn(() => true),
}));
