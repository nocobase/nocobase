/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AssociationValueInput } from '../AssociationValueInput';

const { list, resource, select } = vi.hoisted(() => ({
  list: vi.fn(),
  resource: vi.fn(),
  select: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  RemoteSelect: (props: { request: () => Promise<unknown>; onChange: (value: string[]) => void }) => {
    select(props);
    React.useEffect(() => {
      props.request();
    }, [props]);
    return <button onClick={() => props.onChange(['b'])}>Select</button>;
  },
}));
vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      api: { resource },
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollection: () => ({
              getField: () => ({
                targetCollection: { filterTargetKey: 'id' },
                targetCollectionTitleFieldName: 'title',
              }),
            }),
          },
        }),
      },
    },
  }),
}));
vi.mock('../../WorkflowVariableWrapper', () => ({
  WorkflowVariableWrapper: ({ render: renderInput, ...props }) => renderInput(props),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resource.mockReturnValue({ list });
  list.mockResolvedValueOnce({ data: { data: [{ code: 'b', title: 'Second' }] } });
  list.mockResolvedValueOnce({ data: { data: [{ code: 'a', title: 'First' }] } });
});

it.each([[['a']], [[{ code: 'a', title: 'Old title' }]]])(
  'loads saved association keys outside the first page and emits keys for %j',
  async (value) => {
    const onChange = vi.fn();
    render(
      <AssociationValueInput
        collection="other:posts"
        field={{ name: 'tags', type: 'belongsToMany', target: 'tags', targetKey: 'code' }}
        value={value}
        onChange={onChange}
      />,
    );
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(resource).toHaveBeenCalledWith('tags', null, { 'x-data-source': 'other' });
    expect(list).toHaveBeenLastCalledWith({ filter: { code: { $in: ['a'] } }, paginate: false });
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        value: ['a'],
        mode: 'multiple',
        fieldNames: { label: 'title', value: 'code' },
      }),
    );
    fireEvent.click(screen.getByText('Select'));
    expect(onChange).toHaveBeenCalledWith(['b']);
  },
);
