// @vitest-environment node

import { createSecretsService } from '@nocobase/app-server/secrets';
import { describe, expect, it } from 'vitest';

import { uploadTicketKey } from '../../server/previews/secrets.js';

const keys = [{ version: 1, key: 'd'.repeat(64) }];

describe('upload ticket key', () => {
  it('signs upload tickets with a derived key, auth.secret, or a key of the process', () => {
    const service = createSecretsService({ keys });
    expect(uploadTicketKey(service, 'auth')).toBe(
      service.keyring('studio/builds/upload-tickets')[0]!.value,
    );
    expect(uploadTicketKey(createSecretsService({ keys: [] }), 'auth')).toBe(
      'auth',
    );
    expect(uploadTicketKey(undefined, undefined)).not.toBe(
      uploadTicketKey(undefined, undefined),
    );
  });
});
