/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { TriggerCustomActionConfig } from '../TriggerCustomActionConfig';

const remoteSelectState = vi.hoisted(() => ({
  propsList: [] as Array<{
    cacheKey?: string;
    onSearch?: (value: string) => void;
    request: () => Promise<any[]>;
  }>,
}));

const usersListMock = vi.fn();
const rolesListMock = vi.fn();

vi.mock('@nocobase/client-v2', () => ({
  RemoteSelect: (props: any) => {
    remoteSelectState.propsList.push(props);
    return <div data-testid={`remote-select:${props.cacheKey}`} />;
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  FlowContextSelector: () => null,
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
      api: {
        resource: (name: string) => ({
          list: name === 'users' ? usersListMock : rolesListMock,
        }),
      },
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollection: () => ({
              filterTargetKey: 'id',
              titleCollectionField: { name: 'title' },
            }),
          },
        }),
      },
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  parseCollectionName: (value: string) => ['main', value],
  TriggerCollectionRecordSelect: () => <div data-testid="trigger-collection-record-select" />,
  useCurrentWorkflowContext: () => ({
    config: { type: 0, collection: 'posts' },
  }),
  useWorkflowVariableOptions: () => [],
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

usersListMock.mockImplementation(async () => ({
  data: {
    data: [{ id: 1, nickname: 'NocoBase' }],
  },
}));

rolesListMock.mockImplementation(async () => ({
  data: {
    data: [{ name: 'admin', title: 'Admin' }],
  },
}));

describe('TriggerCustomActionConfig', () => {
  it('uses searchable remote selects for actor and role with debounced 200-item requests', async () => {
    vi.useFakeTimers();
    usersListMock.mockClear();
    rolesListMock.mockClear();
    remoteSelectState.propsList = [];

    try {
      render(
        <Form>
          <TriggerCustomActionConfig />
        </Form>,
      );

      expect(screen.getByTestId('remote-select:workflow-custom-action-trigger:users')).toBeInTheDocument();
      expect(screen.getByTestId('remote-select:workflow-custom-action-trigger:roles')).toBeInTheDocument();

      const getUserSelectProps = () =>
        remoteSelectState.propsList.filter((props) => props.cacheKey === 'workflow-custom-action-trigger:users').at(-1);
      const getRoleSelectProps = () =>
        remoteSelectState.propsList.filter((props) => props.cacheKey === 'workflow-custom-action-trigger:roles').at(-1);

      await getUserSelectProps()?.request();
      await getRoleSelectProps()?.request();

      expect(usersListMock).toHaveBeenLastCalledWith({ pageSize: 200 });
      expect(rolesListMock).toHaveBeenLastCalledWith({ pageSize: 200 });

      act(() => {
        getUserSelectProps()?.onSearch?.('No');
        getRoleSelectProps()?.onSearch?.('Ad');
      });

      await getUserSelectProps()?.request();
      await getRoleSelectProps()?.request();

      expect(usersListMock).toHaveBeenLastCalledWith({ pageSize: 200 });
      expect(rolesListMock).toHaveBeenLastCalledWith({ pageSize: 200 });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await getUserSelectProps()?.request();
      await getRoleSelectProps()?.request();

      expect(usersListMock).toHaveBeenLastCalledWith({
        pageSize: 200,
        filter: {
          nickname: {
            $includes: 'No',
          },
        },
      });
      expect(rolesListMock).toHaveBeenLastCalledWith({
        pageSize: 200,
        filter: {
          title: {
            $includes: 'Ad',
          },
        },
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
