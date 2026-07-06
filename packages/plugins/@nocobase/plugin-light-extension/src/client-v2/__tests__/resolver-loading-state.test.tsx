/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { RepoEntryPublicationSelector } from '../components/RepoEntryPublicationSelector';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, resolve: resolveDeferred, reject: rejectDeferred };
}

describe('RepoEntryPublicationSelector loading state', () => {
  it('shows loading only while selector requests are in flight', async () => {
    const entriesRequest = createDeferred<{ data: { data: [] } }>();
    mocks.request.mockReturnValueOnce(entriesRequest.promise);
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });

    const { container } = render(
      <FlowEngineProvider engine={engine}>
        <RepoEntryPublicationSelector />
      </FlowEngineProvider>,
    );

    expect(container.querySelector('.ant-spin')).toBeTruthy();

    await act(async () => {
      entriesRequest.resolve({ data: { data: [] } });
      await entriesRequest.promise;
    });

    await waitFor(() => {
      expect(container.querySelector('.ant-spin')).toBeNull();
    });
  });
});
