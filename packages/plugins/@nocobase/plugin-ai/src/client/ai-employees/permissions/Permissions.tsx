/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useMemo, useState } from 'react';
import { SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import { useT } from '../../locale';
import { RolesManagerContext } from '@nocobase/plugin-acl/client';
import { createForm, onFormValuesChange, Form } from '@formily/core';
import { useMemoizedFn } from 'ahooks';
import { message, Table, Checkbox, Avatar } from 'antd';
import { avatars } from '../avatars';
import { AIEmployee } from '../types';

const useFormProps = () => {
  const t = useT();
  const api = useAPIClient();
  const { role, setRole } = useContext(RolesManagerContext);
  const update = useMemoizedFn(async (form: Form) => {
    await api.resource('roles').update({
      filterByTk: role.name,
      values: form.values,
    });
    setRole({ ...role, ...form.values });
    message.success(t('Saved successfully'));
  });
  const form = useMemo(() => {
    return createForm({
      values: role,
      effects() {
        onFormValuesChange(async (form) => {
          await update(form);
        });
      },
    });
  }, [role, update]);

  return {
    form,
  };
};

export const Permissions: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const t = useT();
  const [checkedList, setCheckedList] = useState<string[]>([]);
  const { role } = useContext(RolesManagerContext);
  const api = useAPIClient();

  const { loading, data, refresh } = useRequest<{
    data: AIEmployee[];
  }>(
    () =>
      api
        .resource('aiEmployees')
        .list({
          paginate: false,
        })
        .then((res) => res?.data),
    {
      ready: active,
    },
  );

  const resource = api.resource('roles.aiEmployees', role.name);
  const { refresh: refreshAvailable } = useRequest(
    () =>
      resource
        .list({
          paginate: false,
        })
        .then((res) => res?.data?.data),
    {
      ready: active,
      refreshDeps: [role.name],
      onSuccess: (data) => {
        setCheckedList(data.map((item: AIEmployee) => item.username));
      },
    },
  );

  return (
    <>
      <SchemaComponent
        scope={{ useFormProps }}
        schema={{
          type: 'void',
          name: 'ai-employees-permissions',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormProps',
          properties: {
            allowNewAiEmployee: {
              title: t('AI employee permissions'),
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              'x-content': t('New AI employees are allowed to be used by default'),
            },
          },
        }}
      />
      <Table
        loading={loading}
        rowKey={'username'}
        pagination={false}
        columns={[
          {
            dataIndex: 'avatar',
            title: t('Avatar'),
            render: (avatar) => {
              return avatar && <Avatar src={avatars(avatar)} />;
            },
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
            dataIndex: 'available',
            title: (
              <>
                <Checkbox
                  checked={checkedList.length === data?.data.length}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (!checked) {
                      await resource.set({
                        values: [],
                      });
                    } else {
                      await resource.set({
                        values: data?.data.map((item: AIEmployee) => item.username),
                      });
                    }
                    refresh();
                    refreshAvailable();
                    message.success(t('Saved successfully'));
                  }}
                />{' '}
                {t('Available')}
              </>
            ),
            render: (_, { username }) => {
              const checked = checkedList.includes(username);
              return (
                <Checkbox
                  checked={checked}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      await resource.add({
                        values: [username],
                      });
                      setCheckedList((prev) => [...prev, username]);
                    } else {
                      await resource.remove({
                        values: [username],
                      });
                      setCheckedList((prev) => prev.filter((item) => item !== username));
                    }
                    refresh();
                    refreshAvailable();
                    message.success(t('Saved successfully'));
                  }}
                />
              );
            },
          },
        ]}
        dataSource={data?.data || []}
      />
    </>
  );
};
