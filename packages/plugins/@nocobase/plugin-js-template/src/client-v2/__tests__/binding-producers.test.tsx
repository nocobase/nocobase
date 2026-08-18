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

import type { JsTemplateSelectableTemplateSummary } from '../../shared/types';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { JSBlockJsTemplateSourceField } from '../components/JSBlockJsTemplateSourceField';
import { createJsTemplateModelMenuProvider } from '../modelMenu/createJsTemplateModelMenuProvider';
import { createJsTemplateRunJSResolver } from '../resolvers/JsTemplateRunJSResolver';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const SchemaField = createSchemaField({ components: { JSBlockJsTemplateSourceField } });

describe('JS Template binding producers', () => {
  it('persists only canonical identity fields from source and model menu catalogs', async () => {
    const authorized = createTemplate({ projectName: 'sales-tools', projectTitle: 'Sales tools' });
    const restricted = createTemplate();
    const expectedBinding = {
      type: 'js-template-entry',
      projectId: 'project-sales',
      templateId: 'template-sales',
      kind: 'js-block',
    };

    await expect(getSourceMenuBinding(authorized)).resolves.toEqual(expectedBinding);
    await expect(getSourceMenuBinding(restricted)).resolves.toEqual(expectedBinding);
    await expect(getModelMenuBinding(authorized)).resolves.toEqual(expectedBinding);
    await expect(getModelMenuBinding(restricted)).resolves.toEqual(expectedBinding);
  });

  it('displays catalog labels without persisted display metadata', async () => {
    const api = createApi(createTemplate());
    const form = createForm({
      initialValues: {
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: 'project-sales',
          templateId: 'template-sales',
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
                  'x-component': 'JSBlockJsTemplateSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => expect(screen.getByText('JS Template / project-sales / sales-dashboard')).toBeInTheDocument());
  });
});

async function getSourceMenuBinding(template: JsTemplateSelectableTemplateSummary) {
  const items = await createJsTemplateRunJSResolver(createApi(template)).listSourceMenuItems?.({
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

async function getModelMenuBinding(template: JsTemplateSelectableTemplateSummary) {
  const provider = createJsTemplateModelMenuProvider(createApi(template), { target: 'block' });
  const roots = Array.isArray(provider) ? provider : await provider(createContext());
  const projects = await resolveChildren(roots[0]);
  const templates = await resolveChildren(projects[0]);
  const options = templates[0].createModelOptions;
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

function createApi(template: JsTemplateSelectableTemplateSummary): ApiClientLike {
  return {
    request: vi.fn(async <TResponse,>() => ({ data: { data: [template] } }) as TResponse),
  };
}

function createTemplate(
  labels: { projectName?: string; projectTitle?: string } = {},
): JsTemplateSelectableTemplateSummary {
  return {
    id: 'template-sales',
    projectId: 'project-sales',
    ...labels,
    kind: 'js-block',
    templateName: 'sales-dashboard',
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
