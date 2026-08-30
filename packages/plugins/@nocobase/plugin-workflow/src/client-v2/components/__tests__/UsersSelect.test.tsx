/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  filter: vi.fn(),
  flowContextSelector: vi.fn(() => null),
  remoteSelect: vi.fn(() => null),
  variableOptions: vi.fn(() => []),
}));

vi.mock('@nocobase/client-v2', () => ({ RemoteSelect: holder.remoteSelect }));
vi.mock('@nocobase/flow-engine', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  FlowContextSelector: holder.flowContextSelector,
  useFlowContext: () => ({
    api: { resource: () => ({ list: vi.fn().mockResolvedValue({ data: { data: [] } }) }) },
    t: (key: string) => key,
  }),
}));
vi.mock('../../canvas/useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: holder.variableOptions,
}));
vi.mock('../../canvas/WorkflowVariableTag', () => ({
  WorkflowVariableTag: ({ value }: { value?: string }) => <span>{value}</span>,
}));
vi.mock('../FilterDynamicComponent', () => ({
  FilterDynamicComponent: (props: Record<string, unknown>) => {
    holder.filter(props);
    return null;
  },
}));
vi.mock('../../locale', () => ({ useT: () => (key: string) => key }));

import { UsersSelect } from '../UsersSelect';

describe('UsersSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.variableOptions.mockReturnValue([]);
  });

  it('filters workflow variables to user key fields', () => {
    render(<UsersSelect />);

    const options = holder.variableOptions.mock.calls[0][0] as {
      types: Array<(field: Record<string, unknown>) => boolean>;
    };
    expect(options.types[0]({ collectionName: 'users', name: 'id' })).toBe(true);
    expect(options.types[0]({ collectionName: 'users', name: 'nickname' })).toBe(false);
    expect(options.types[0]({ isForeignKey: true, target: 'users' })).toBe(true);
  });

  it('uses the shared variable selector and supports nullable receivers', () => {
    render(<UsersSelect nullable value="" />);

    expect(holder.flowContextSelector).toHaveBeenCalledWith(
      expect.objectContaining({ active: false, dropdownFooter: null }),
      expect.anything(),
    );
    const metaTree = holder.flowContextSelector.mock.calls[0][0].metaTree;
    expect(metaTree.map((node: { name: string }) => node.name)).toEqual([
      'null',
      'constant',
      '$scopes',
      '$jobsMapByNodeKey',
    ]);
  });

  it('forwards transformed workflow variables to user queries', () => {
    const transformVariableOptions = vi.fn((options) => options);

    render(<UsersSelect value={{ filter: {} }} transformVariableOptions={transformVariableOptions} />);

    expect(holder.filter).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', transformVariableOptions }),
    );
  });
});
