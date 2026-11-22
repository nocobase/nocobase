import { describe, expect, it } from 'vitest';

import { describeDevice } from '../../pages/device.js';

describe('describeDevice', () => {
  it('recognizes the command-line client that signs in through /device', () => {
    expect(
      describeDevice('nocobase-cli/1.0.0 (devbox; linux x64) node/24.21.0'),
    ).toEqual({
      kind: 'commandLine',
      client: 'nocobase-cli',
      os: 'Linux',
      mobile: false,
    });
  });

  it('names a browser and its system', () => {
    expect(
      describeDevice(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      ),
    ).toMatchObject({ kind: 'browser', client: 'Chrome', os: 'macOS' });
    expect(
      describeDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      ),
    ).toMatchObject({
      kind: 'browser',
      client: 'Safari',
      os: 'iOS',
      mobile: true,
    });
  });

  it('admits an unknown device', () => {
    expect(describeDevice(undefined)).toEqual({
      kind: 'unknown',
      mobile: false,
    });
  });
});
