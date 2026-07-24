/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionSelectableEntrySummary } from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { JSBlockLightExtensionSourceField } from '../components/JSBlockLightExtensionSourceField';
import { createLightExtensionModelMenuProvider } from '../modelMenu/createLightExtensionModelMenuProvider';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const SchemaField = createSchemaField({ components: { JSBlockLightExtensionSourceField } });

describe('light extension binding producers', () => {
  it('persists repository hints from authorized source and model menu catalogs only', async () => {
    const authorized = createEntry({ repoName: 'sales-tools', repoTitle: 'Sales tools' });
    const restricted = createEntry();

    await expect(getSourceMenuBinding(authorized)).resolves.toMatchObject({
      repoName: 'sales-tools',
      repoTitle: 'Sales tools',
    });
    await expect(getSourceMenuBinding(restricted)).resolves.not.toHaveProperty('repoName');
    await expect(getSourceMenuBinding(restricted)).resolves.not.toHaveProperty('repoTitle');

    await expect(getModelMenuBinding(authorized)).resolves.toMatchObject({
      repoName: 'sales-tools',
      repoTitle: 'Sales tools',
    });
    await expect(getModelMenuBinding(restricted)).resolves.not.toHaveProperty('repoName');
    await expect(getModelMenuBinding(restricted)).resolves.not.toHaveProperty('repoTitle');
  });

  it('does not display a persisted high-permission repository hint before catalog authorization', async () => {
    const api = createApi(createEntry());
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo-sales',
          repoTitle: 'Secret repository title',
          entryId: 'entry-sales',
          entryName: 'sales-dashboard',
          kind: 'js-block',
        },
        settings: {},
      },
    });
    const engine = new FlowEngine();
    engine.context.defineProperty('api', { value: api });

    render(
      <FlowEngineProvider engine={engine}>
        <FormProvider form={form}>
          <SchemaField
            schema={{
              type: 'object',
              properties: {
                sourceBinding: {
                  type: 'object',
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => expect(screen.getByText('Light extension / repo-sales / sales-dashboard')).toBeInTheDocument());
    expect(screen.queryByText(/Secret repository title/)).not.toBeInTheDocument();
  });
});

async function getSourceMenuBinding(entry: LightExtensionSelectableEntrySummary) {
  const items = await createLightExtensionRunJSResolver(createApi(entry)).listSourceMenuItems?.({
    kind: 'js-block',
    sourceMode: 'inline',
    t: (key) => key,
  });
  const onSelect = items?.[1]?.children?.[0]?.onSelect;
  if (!onSelect) {
    throw new Error('Source menu binding was not found');
  }
  const params = await onSelect({
    kind: 'js-block',
    sourceMode: 'inline',
    params: {},
    defaultParams: {},
  });
  if (!params) {
    throw new Error('Source menu binding params were not returned');
  }
  return params.sourceBinding;
}

async function getModelMenuBinding(entry: LightExtensionSelectableEntrySummary) {
  const provider = createLightExtensionModelMenuProvider(createApi(entry), { target: 'block' });
  const roots = Array.isArray(provider) ? provider : await provider(createContext());
  const repos = await resolveChildren(roots[0]);
  const entries = await resolveChildren(repos[0]);
  const options = entries[0].createModelOptions;
  if (!options || typeof options === 'function') {
    throw new Error('Static model menu binding was not found');
  }
  return (options.stepParams?.jsSettings?.runJs as { sourceBinding?: unknown } | undefined)?.sourceBinding;
}

function resolveChildren(item: SubModelItem): Promise<SubModelItem[]> {
  if (!item.children) {
    return Promise.resolve([]);
  }
  return Promise.resolve(Array.isArray(item.children) ? item.children : item.children(createContext()));
}

function createContext(): FlowModelContext {
  return { t: (key: string) => key } as FlowModelContext;
}

function createApi(entry: LightExtensionSelectableEntrySummary): ApiClientLike {
  return {
    request: vi.fn(async <TResponse,>() => ({ data: { data: [entry] } }) as TResponse),
  };
}

function createEntry(labels: { repoName?: string; repoTitle?: string } = {}): LightExtensionSelectableEntrySummary {
  return {
    id: 'entry-sales',
    repoId: 'repo-sales',
    ...labels,
    kind: 'js-block',
    entryName: 'sales-dashboard',
    entryPath: 'src/client/js-blocks/sales-dashboard/index.tsx',
    title: 'Sales dashboard',
    category: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    settingsDefaultsHash: null,
    runtimeCodeHash: 'runtime-sales',
    runtimeAvailable: true,
  };
}
