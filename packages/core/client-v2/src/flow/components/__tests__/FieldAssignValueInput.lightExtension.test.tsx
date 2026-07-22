/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@nocobase/test/client';
import type { MetaTreeNode, RunJSValue } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useFlowContext: vi.fn(),
  variableInput: vi.fn((_props: Record<string, unknown>) => null),
  runJSValueEditor: vi.fn((_props: Record<string, unknown>) => null),
}));

vi.mock('../RunJSValueEditor', () => ({
  RunJSValueEditor: (props: Record<string, unknown>) => {
    mocks.runJSValueEditor(props);
    return null;
  },
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowContext: () => mocks.useFlowContext(),
    VariableInput: (props: Record<string, unknown>) => {
      mocks.variableInput(props);
      return <div data-testid="variable-input" />;
    },
  };
});

import { FieldAssignValueInput } from '../FieldAssignValueInput';
import { RunJSSourceResolverRegistry } from '../runjs-source';

describe('FieldAssignValueInput RunJS menu', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
    mocks.useFlowContext.mockReset();
    mocks.variableInput.mockReset();
    mocks.runJSValueEditor.mockReset();
  });

  it('keeps only the regular RunJS entry and does not query light-extension sources', async () => {
    const listSourceMenuItems = vi.fn(async () => [{ key: 'entry:entry_total', label: 'Order total' }]);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({ code: 'return 1;', version: 'v2' }),
      listSourceMenuItems,
    });

    const collectionField = {
      name: 'status',
      interface: 'input',
      uiSchema: {},
      isAssociationField: () => false,
    };
    const collection = {
      dataSourceKey: 'main',
      getField: (name: string) => (name === 'status' ? collectionField : null),
      getFields: () => [collectionField],
    };
    mocks.useFlowContext.mockReturnValue({
      model: {
        context: {
          collection,
          dataSourceManager: { getDataSource: vi.fn(() => ({})) },
        },
      },
      t: (key: string) => key,
      getPropertyMetaTree: vi.fn(async () => [{ name: 'record', paths: ['record'], type: 'object' }]),
    });

    render(<FieldAssignValueInput targetPath="status" value="" onChange={vi.fn()} />);

    await waitFor(() => expect(mocks.variableInput).toHaveBeenCalled());
    const variableInputProps = mocks.variableInput.mock.calls.at(-1)?.[0] as {
      metaTree?: () => Promise<MetaTreeNode[]>;
      converters?: {
        resolvePathFromValue?: (value: unknown) => string[] | undefined;
        resolveValueFromPath?: (item: MetaTreeNode) => unknown;
      };
    };
    const metaTree = await variableInputProps.metaTree?.();

    expect(metaTree?.map((item) => item.name)).toEqual(['constant', 'null', 'runjs', 'record']);
    expect(listSourceMenuItems).not.toHaveBeenCalled();
    expect(variableInputProps.converters?.resolveValueFromPath?.({ name: 'runjs', paths: ['runjs'] })).toEqual({
      code: '',
      version: 'v2',
    });

    const staleLightExtensionValue: RunJSValue = {
      code: '',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'repo_orders',
        entryId: 'entry_total',
        kind: 'runjs',
      },
    };
    expect(variableInputProps.converters?.resolvePathFromValue?.(staleLightExtensionValue)).toEqual(['runjs']);

    const RunJSComponent = metaTree?.find((item) => item.name === 'runjs')?.render as React.ComponentType<{
      value?: RunJSValue;
      onChange?: (value: RunJSValue) => void;
    }>;
    render(<RunJSComponent value={staleLightExtensionValue} onChange={vi.fn()} />);
    const editorProps = mocks.runJSValueEditor.mock.calls.at(-1)?.[0];
    expect(editorProps?.sourceLocator).toBeUndefined();
    expect(editorProps?.onEmbeddedEditorControllerChange).toBeUndefined();
  });
});
