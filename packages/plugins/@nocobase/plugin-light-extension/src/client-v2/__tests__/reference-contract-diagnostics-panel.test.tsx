/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { ReferenceContractDiagnosticsPanel } from '../components/ReferenceContractDiagnosticsPanel';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: (key: string) => key,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

describe('ReferenceContractDiagnosticsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders adapter contracts and triggers rebuild dry-run for the selected repository', async () => {
    mocks.request.mockImplementation((options: { data?: { dryRun?: boolean } }) =>
      Promise.resolve({
        data: {
          data: options.data?.dryRun ? createDiagnosticsWithDryRun() : createDiagnostics(),
        },
      }),
    );

    renderWithEngine(<ReferenceContractDiagnosticsPanel repoId="ler_sales" />);

    expect(await screen.findByText('js-block')).toBeTruthy();
    expect(screen.getByText('flowModel.step')).toBeTruthy();
    expect(screen.getByText('Active adapter')).toBeTruthy();
    expect(screen.getByText('js-field')).toBeTruthy();
    expect(screen.getByText('Waiting for host task')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Rebuild dry-run/ }));

    await waitFor(() =>
      expect(mocks.request).toHaveBeenLastCalledWith({
        url: 'lightExtensionReferences:diagnostics',
        method: 'post',
        data: {
          repoId: 'ler_sales',
          dryRun: true,
        },
      }),
    );
    expect(await screen.findByText('lef_owner_hash')).toBeTruthy();
    expect(screen.getByText('lee_sales_kpi')).toBeTruthy();
  });
});

function renderWithEngine(children: React.ReactNode) {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });

  return render(<FlowEngineProvider engine={engine}>{children}</FlowEngineProvider>);
}

function createDiagnostics() {
  return {
    ownerAdapters: [
      {
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        title: 'JS Block',
        status: 'active',
        locatorContract: 'FlowModel JSBlockModel step settings locator',
        modelUse: 'JSBlockModel',
        message: 'Active adapter',
        supportsRebuild: true,
      },
      {
        kind: 'js-field',
        ownerKind: 'flowModel.fieldSettings',
        title: 'JS Field',
        status: 'placeholder',
        locatorContract: 'Field model settings locator',
        implementationTask: '03-task-js-field-entry-end-to-end.md',
        message: 'Waiting for host task',
        supportsRebuild: true,
      },
    ],
  };
}

function createDiagnosticsWithDryRun() {
  return {
    ...createDiagnostics(),
    rebuild: {
      dryRun: true,
      scanned: 1,
      upserted: 1,
      removed: 0,
      ownerMissing: 0,
      statusCounts: {
        active: 1,
      },
      items: [
        {
          action: 'upsert',
          kind: 'js-block',
          ownerKind: 'flowModel.step',
          ownerLocatorHash: 'lef_owner_hash',
          repoId: 'ler_sales',
          entryId: 'lee_sales_kpi',
          resolvedStatus: 'active',
        },
      ],
    },
  };
}
