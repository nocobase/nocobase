/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Avatar, Checkbox, Flex, Table, Typography } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { TableProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFlowContext } from '@nocobase/flow-engine';
import type { FlowContext } from '@nocobase/flow-engine';
import type { Role } from '@nocobase/plugin-acl/client-v2';
import { useT } from '../../locale';
import { avatars } from '../../ai-employees/avatars';
import type { AIEmployee } from '../../ai-employees/types';

type AIEmployeePermissionRole = Role & {
  allowNewAiEmployee?: boolean;
};

type ResourceListAction = (params?: Record<string, unknown>) => Promise<unknown>;
type ResourceUpdateAction = (params: { filterByTk: string; values: Record<string, unknown> }) => Promise<unknown>;
type ResourceValuesAction = (params: { values: string[] }) => Promise<unknown>;

type AIEmployeesResource = {
  list: ResourceListAction;
};

type RolesResource = {
  update: ResourceUpdateAction;
};

type RoleAIEmployeesResource = {
  list: ResourceListAction;
  add: ResourceValuesAction;
  remove: ResourceValuesAction;
  set: ResourceValuesAction;
};

export type PermissionsAPIClient = {
  resource(name: 'aiEmployees'): AIEmployeesResource;
  resource(name: 'roles'): RolesResource;
  resource(name: 'roles.aiEmployees', roleName: string): RoleAIEmployeesResource;
};

type AIEmployeesPermissionsContext = FlowContext & {
  api: PermissionsAPIClient;
  message: {
    success: (content: string) => void;
  };
};

type PermissionsProps = {
  active: boolean;
  role: AIEmployeePermissionRole | null;
  onRoleChange: (role: Role | null) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getNestedData(value: unknown): unknown {
  if (!isRecord(value)) {
    return undefined;
  }
  const data = value.data;
  if (!isRecord(data)) {
    return data;
  }
  return data.data;
}

function isAIEmployee(value: unknown): value is AIEmployee {
  return isRecord(value) && typeof value.username === 'string';
}

function extractAIEmployees(response: unknown): AIEmployee[] {
  const data = getNestedData(response);
  return Array.isArray(data) ? data.filter(isAIEmployee) : [];
}

export async function listPermissionAIEmployees(api: PermissionsAPIClient) {
  const response = await api.resource('aiEmployees').list({
    paginate: false,
  });
  return extractAIEmployees(response);
}

export async function listAvailableAIEmployees(api: PermissionsAPIClient, roleName: string) {
  const response = await api.resource('roles.aiEmployees', roleName).list({
    paginate: false,
  });
  return extractAIEmployees(response).map((item) => item.username);
}

export async function updateAllowNewAIEmployee(
  api: PermissionsAPIClient,
  role: AIEmployeePermissionRole,
  allowNewAiEmployee: boolean,
) {
  await api.resource('roles').update({
    filterByTk: role.name,
    values: {
      allowNewAiEmployee,
    },
  });
  return {
    ...role,
    allowNewAiEmployee,
  };
}

export async function setAvailableAIEmployees(api: PermissionsAPIClient, roleName: string, usernames: string[]) {
  await api.resource('roles.aiEmployees', roleName).set({
    values: usernames,
  });
}

export async function addAvailableAIEmployee(api: PermissionsAPIClient, roleName: string, username: string) {
  await api.resource('roles.aiEmployees', roleName).add({
    values: [username],
  });
}

export async function removeAvailableAIEmployee(api: PermissionsAPIClient, roleName: string, username: string) {
  await api.resource('roles.aiEmployees', roleName).remove({
    values: [username],
  });
}

export function Permissions(props: PermissionsProps) {
  const ctx = useFlowContext() as AIEmployeesPermissionsContext;
  const t = useT();
  const role = props.role;
  const { active, onRoleChange } = props;
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [availableUsernames, setAvailableUsernames] = useState<string[]>([]);
  const [allowNewAiEmployee, setAllowNewAiEmployee] = useState(!!role?.allowNewAiEmployee);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string>();

  useEffect(() => {
    setAllowNewAiEmployee(!!role?.allowNewAiEmployee);
  }, [role?.allowNewAiEmployee, role?.name]);

  const reload = useCallback(async () => {
    if (!role) {
      setEmployees([]);
      setAvailableUsernames([]);
      return;
    }
    setLoading(true);
    try {
      const [nextEmployees, nextAvailableUsernames] = await Promise.all([
        listPermissionAIEmployees(ctx.api),
        listAvailableAIEmployees(ctx.api, role.name),
      ]);
      setEmployees(nextEmployees);
      setAvailableUsernames(nextAvailableUsernames);
    } finally {
      setLoading(false);
    }
  }, [ctx.api, role]);

  useEffect(() => {
    if (active) {
      reload();
    }
  }, [active, reload]);

  const employeeUsernames = useMemo(() => employees.map((employee) => employee.username), [employees]);
  const allChecked = employeeUsernames.length > 0 && availableUsernames.length === employeeUsernames.length;
  const someChecked = availableUsernames.length > 0 && availableUsernames.length < employeeUsernames.length;

  const updateAvailableUsernames = useCallback(
    (username: string, checked: boolean) => {
      setAvailableUsernames((prev) => {
        const next = checked ? [...prev, username] : prev.filter((item) => item !== username);
        return Array.from(new Set(next));
      });
    },
    [setAvailableUsernames],
  );

  const handleAllowNewChange = useCallback(
    async (event: CheckboxChangeEvent) => {
      if (!role) {
        return;
      }
      const nextValue = event.target.checked;
      setAllowNewAiEmployee(nextValue);
      setSavingKey('allowNewAiEmployee');
      try {
        const nextRole = await updateAllowNewAIEmployee(ctx.api, role, nextValue);
        onRoleChange(nextRole);
        ctx.message.success(t('Saved successfully'));
      } finally {
        setSavingKey(undefined);
      }
    },
    [ctx.api, ctx.message, onRoleChange, role, t],
  );

  const handleCheckAll = useCallback(
    async (event: CheckboxChangeEvent) => {
      if (!role) {
        return;
      }
      const nextUsernames = event.target.checked ? employeeUsernames : [];
      setSavingKey('all');
      try {
        await setAvailableAIEmployees(ctx.api, role.name, nextUsernames);
        setAvailableUsernames(nextUsernames);
        ctx.message.success(t('Saved successfully'));
      } finally {
        setSavingKey(undefined);
      }
    },
    [ctx.api, ctx.message, employeeUsernames, role, t],
  );

  const handleCheckOne = useCallback(
    async (username: string, checked: boolean) => {
      if (!role) {
        return;
      }
      setSavingKey(username);
      try {
        if (checked) {
          await addAvailableAIEmployee(ctx.api, role.name, username);
        } else {
          await removeAvailableAIEmployee(ctx.api, role.name, username);
        }
        updateAvailableUsernames(username, checked);
        ctx.message.success(t('Saved successfully'));
      } finally {
        setSavingKey(undefined);
      }
    },
    [ctx.api, ctx.message, role, t, updateAvailableUsernames],
  );

  const columns = useMemo<TableProps<AIEmployee>['columns']>(
    () => [
      {
        dataIndex: 'avatar',
        title: t('Avatar'),
        render: (avatar?: string) => (avatar ? <Avatar src={avatars(avatar)} /> : null),
      },
      {
        dataIndex: 'nickname',
        title: t('Nickname'),
      },
      {
        dataIndex: 'username',
        title: t('Username'),
      },
      {
        dataIndex: 'position',
        title: t('Position'),
      },
      {
        dataIndex: 'available',
        title: (
          <Checkbox
            checked={allChecked}
            disabled={!role || !!savingKey || loading}
            indeterminate={someChecked}
            onChange={handleCheckAll}
          >
            {t('Available')}
          </Checkbox>
        ),
        render: (_: unknown, record) => {
          const checked = availableUsernames.includes(record.username);
          return (
            <Checkbox
              checked={checked}
              disabled={!role || !!savingKey || loading}
              onChange={(event) => handleCheckOne(record.username, event.target.checked)}
            />
          );
        },
      },
    ],
    [allChecked, availableUsernames, handleCheckAll, handleCheckOne, loading, role, savingKey, someChecked, t],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <Flex vertical gap="middle">
      <Checkbox checked={allowNewAiEmployee} disabled={!!savingKey} onChange={handleAllowNewChange}>
        {t('New AI employees are allowed to be used by default')}
      </Checkbox>
      <Table<AIEmployee>
        loading={loading}
        rowKey="username"
        pagination={false}
        columns={columns}
        dataSource={employees}
      />
    </Flex>
  );
}

export default Permissions;
