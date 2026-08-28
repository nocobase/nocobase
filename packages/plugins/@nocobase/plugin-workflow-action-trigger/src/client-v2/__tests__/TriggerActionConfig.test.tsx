/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import TriggerActionConfig from '../TriggerActionConfig';

const remoteSelectState = vi.hoisted(() => ({
  propsList: [] as Array<{
    cacheKey?: string;
    request?: () => Promise<any[]>;
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
  useFlowEngine: () => ({
    context: {
      api: {
        resource: (name: string) => ({
          list: name === 'users' ? usersListMock : rolesListMock,
        }),
      },
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  TriggerCollectionRecordSelect: () => <div data-testid="trigger-collection-record-select" />,
  WorkflowVariableWrapper: ({ render, value, onChange }: any) => render({ value, onChange }),
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

describe('TriggerActionConfig', () => {
  it('wires actor and role fields through remote selects inside the workflow wrapper', async () => {
    usersListMock.mockClear();
    rolesListMock.mockClear();
    remoteSelectState.propsList = [];

    render(
      <Form>
        <TriggerActionConfig />
      </Form>,
    );

    expect(screen.getByTestId('remote-select:workflow-action-trigger:users')).toBeInTheDocument();
    expect(screen.getByTestId('remote-select:workflow-action-trigger:roles')).toBeInTheDocument();

    const getUserSelectProps = () =>
      remoteSelectState.propsList.filter((props) => props.cacheKey === 'workflow-action-trigger:users').at(-1);
    const getRoleSelectProps = () =>
      remoteSelectState.propsList.filter((props) => props.cacheKey === 'workflow-action-trigger:roles').at(-1);

    await getUserSelectProps()?.request?.();
    await getRoleSelectProps()?.request?.();

    expect(usersListMock).toHaveBeenLastCalledWith({ pageSize: 200 });
    expect(rolesListMock).toHaveBeenLastCalledWith({ pageSize: 200 });
  });
});
