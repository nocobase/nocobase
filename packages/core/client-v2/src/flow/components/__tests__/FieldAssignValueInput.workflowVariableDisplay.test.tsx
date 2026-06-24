/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FieldAssignValueInput } from '../FieldAssignValueInput';

const { mockFlowContext, mockVariableInput } = vi.hoisted(() => {
  const usernameField = {
    name: 'username',
    interface: 'input',
    uiSchema: { title: 'Username' },
    isAssociationField: () => false,
  };
  const collection = {
    dataSourceKey: 'main',
    getField: vi.fn((name: string) => (name === 'username' ? usernameField : undefined)),
    getFields: vi.fn(() => [usernameField]),
  };
  const selectedMeta = {
    name: 'createdAt',
    title: 'Created at',
    paths: ['$jobsMapByNodeKey', 'query1', 'createdAt'],
  };
  const workflowMetaTree = [
    {
      name: '$jobsMapByNodeKey',
      title: 'Node result',
      paths: ['$jobsMapByNodeKey'],
      children: vi.fn(async () => [
        {
          name: 'query1',
          title: 'Query record',
          paths: ['$jobsMapByNodeKey', 'query1'],
          children: vi.fn(async () => [selectedMeta]),
        },
      ]),
    },
  ];

  return {
    mockFlowContext: {
      t: (key: string) => key,
      model: {
        context: {
          collection,
          dataSourceManager: {
            getDataSource: vi.fn(() => ({ key: 'main' })),
          },
        },
      },
      getPropertyMetaTree: vi.fn(() => workflowMetaTree),
    },
    mockVariableInput: vi.fn((props: any) => {
      const [ready, setReady] = React.useState(false);
      React.useEffect(() => {
        Promise.resolve(props.metaTree?.())
          .then(() => setReady(true))
          .catch(() => {});
      }, [props]);

      if (!ready) {
        return null;
      }

      const Component = props.converters.renderInputComponent(selectedMeta);
      return Component ? (
        <Component value="{{$jobsMapByNodeKey.query1.createdAt}}" onChange={props.onChange} style={{ width: '100%' }} />
      ) : null;
    }),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    FlowModelRenderer: () => <div data-testid="flow-model-renderer" />,
    useFlowContext: () => mockFlowContext,
    VariableInput: mockVariableInput,
  };
});

describe('FieldAssignValueInput workflow variable display', () => {
  it('renders selected workflow variables with their path label instead of Constant', async () => {
    render(
      <FieldAssignValueInput
        targetPath="username"
        value="{{$jobsMapByNodeKey.query1.createdAt}}"
        onChange={vi.fn()}
        allowRunJS={false}
        variableFormatPathToValue={(item) => `{{${item.paths?.join('.')}}}`}
        variableParseValueToPath={(value) => {
          if (typeof value !== 'string') return undefined;
          const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
          return match?.[1]?.split('.');
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Node result / Query record / Created at')).toBeInTheDocument();
    });
    expect(screen.queryByText('Constant')).not.toBeInTheDocument();
  });
});
