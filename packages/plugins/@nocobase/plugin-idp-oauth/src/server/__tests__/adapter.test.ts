/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createOidcAdapter } from '../adapter';

describe('plugin-idp-oauth > OidcAdapter', () => {
  const createRecord = (values: Record<string, any>) => ({
    ...values,
    get(key: string) {
      return values[key];
    },
  });

  const createAdapter = (service: any) => {
    const repo = {
      findOne: vi.fn(),
      updateOrCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    };

    const Adapter = createOidcAdapter(
      {
        db: {
          getRepository: vi.fn().mockReturnValue(repo),
        },
      } as any,
      service,
      'oidcStates',
    );

    return {
      repo,
      Adapter,
    };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('Client.find should prefer resolved clients', async () => {
    const service = {
      resolveClient: vi.fn().mockResolvedValue({
        client_id: 'app:alpha',
        redirect_uris: ['https://alpha.example.com/api/callback'],
      }),
    };
    const { Adapter, repo } = createAdapter(service);
    const adapter = new Adapter('Client');

    await expect(adapter.find('app:alpha')).resolves.toEqual({
      client_id: 'app:alpha',
      redirect_uris: ['https://alpha.example.com/api/callback'],
    });
    expect(service.resolveClient).toHaveBeenCalledWith('app:alpha');
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  test('Client.find should fall back to persisted dynamic clients', async () => {
    const service = {
      resolveClient: vi.fn().mockResolvedValue(undefined),
    };
    const { Adapter, repo } = createAdapter(service);
    repo.findOne.mockResolvedValue(
      createRecord({
        id: 1,
        payload: {
          client_id: 'client-1',
        },
      }),
    );
    const adapter = new Adapter('Client');

    await expect(adapter.find('client-1')).resolves.toEqual({
      client_id: 'client-1',
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      filter: {
        model: 'Client',
        oidcId: 'client-1',
      },
    });
  });

  test('non-Client models should use persisted oidc states directly', async () => {
    const service = {
      resolveClient: vi.fn(),
    };
    const { Adapter, repo } = createAdapter(service);
    repo.findOne.mockResolvedValue(
      createRecord({
        id: 1,
        payload: {
          foo: 'bar',
        },
      }),
    );
    const adapter = new Adapter('AuthorizationCode');

    await expect(adapter.find('code-1')).resolves.toEqual({
      foo: 'bar',
    });
    expect(service.resolveClient).not.toHaveBeenCalled();
  });
});
