// @vitest-environment node
import { describe, expect, it } from 'vitest';

import locales from '../client/locales/index.js';

describe('runtime policy translations', () => {
  it.each(Object.entries(locales))(
    'offers timer inheritance controls in %s',
    async (_locale, load) => {
      const resource = await load();
      expect(resource.default).toMatchObject({
        ui: {
          deployments: {
            cancel: expect.any(String),
            queueAhead: expect.stringContaining('{{ahead}}'),
            restartHint: expect.any(String),
            statuses: {
              cancelling: expect.any(String),
              cancelled: expect.any(String),
            },
          },
          policy: {
            idleModeLabel: expect.any(String),
            dormantModeLabel: expect.any(String),
            timerMode: {
              inherit: expect.any(String),
              custom: expect.any(String),
            },
            customTimerHint: expect.any(String),
          },
        },
      });
    },
  );
});
