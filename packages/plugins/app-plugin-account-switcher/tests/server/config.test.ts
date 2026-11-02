import { describe, expect, it } from 'vitest';

import { resolveAccountSwitcherMode } from '../../server/config.js';

const config = (sections: Record<string, unknown> = {}) => ({
  get: <T>(key: string) => sections[key] as T,
});
const full = { accountSwitcher: { mode: 'full' } };

describe('resolveAccountSwitcherMode', () => {
  it('is off when the application registers no section', () => {
    expect(resolveAccountSwitcherMode(config(), 'development')).toBe('off');
  });

  it('allows full only while developing or testing', () => {
    for (const nodeEnv of ['development', 'test'])
      expect(resolveAccountSwitcherMode(config(full), nodeEnv)).toBe('full');
    for (const nodeEnv of ['production', 'staging', undefined])
      expect(() => resolveAccountSwitcherMode(config(full), nodeEnv)).toThrow(
        /only available in development/u,
      );
  });

  it('allows off everywhere', () => {
    expect(
      resolveAccountSwitcherMode(
        config({ accountSwitcher: { mode: 'off' } }),
        'production',
      ),
    ).toBe('off');
  });

  it('is off in a demo, whose write protection would refuse every switch', () => {
    expect(
      resolveAccountSwitcherMode(
        config({ ...full, demoMode: { enabled: true } }),
        'development',
      ),
    ).toBe('off');
    expect(
      resolveAccountSwitcherMode(
        config({ ...full, demoMode: { enabled: false } }),
        'development',
      ),
    ).toBe('full');
  });
});
