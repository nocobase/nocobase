/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useRecord,
  useRequest,
  useResourceActionContext,
  useTableBlockContext,
} from '@nocobase/client';
import React, { useState } from 'react';
import { Tag, Button, Dropdown, App } from 'antd';
import { PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { Field } from '@formily/core';
import { useField, useForm } from '@formily/react';
import { userDepartmentsSchema } from './schemas/users';
import { getDepartmentTitle } from '../utils';
import { useDepartmentTranslation } from '../locale';
import { DepartmentTable } from './DepartmentTable';

const useDataSource = (options?: any) => {
  const defaultRequest = {
    resource: 'departments',
    action: 'list',
    params: {
      appends: ['parent(recursively=true)'],
      // filter: {
      //   parentId: null,
      // },
      sort: ['createdAt'],
    },
  };
  const service = useRequest(defaultRequest, options);
  return {
    ...service,
    defaultRequest,
  };
};

export const UserDepartmentsField: React.FC = () => {
  const { modal, message } = App.useApp();
  const { t } = useDepartmentTranslation();
  const [visible, setVisible] = useState(false);
  const user = useRecord() as any;
  const field = useField<Field>();
  const {
    service: { refresh },
  } = useTableBlockContext();

  const formatData = (data: any[]) => {
    if (!data?.length) {
      return [];
    }

    return data.map((department) => ({
      ...department,
      isMain: department.departmentsUsers?.isMain,
      isOwner: department.departmentsUsers?.isOwner,
      title: getDepartmentTitle(department),
    }));
  };

  const api = useAPIClient();
  useRequest(
    () =>
      api
        .resource(`users.departments`, user.id)
        .list({
          appends: ['parent(recursively=true)'],
          paginate: false,
        })
        .then((res) => {
          const data = formatData(res?.data?.data);
          field.setValue(data);
        }),
    {
      ready: user.id,
    },
  );

  const useAddDepartments = () => {
    const api = useAPIClient();
    const drawerForm = useForm();
    const { departments } = drawerForm.values || {};
    return {
      async run() {
        await api.resource('users.departments', user.id).add({
          values: departments.map((dept: any) => dept.id),
        });
        drawerForm.reset();
        field.setValue([
          ...field.value,
          ...departments.map((dept: any, index: number) => ({
            ...dept,
            isMain: index === 0 && field.value.length === 0,
            title: getDepartmentTitle(dept),
          })),
        ]);
        setVisible(false);
        refresh();
      },
    };
  };

  const removeDepartment = (dept: any) => {
    modal.confirm({
      title: t('Remove department'),
      content: t('Are you sure you want to remove it?'),
      onOk: async () => {
        await api.resource('users.departments', user.id).remove({ values: [dept.id] });
        message.success(t('Deleted successfully'));
        field.setValue(
          field.value
            .filter((d: any) => d.id !== dept.id)
            .map((d: any, index: number) => ({
              ...d,
              isMain: (dept.isMain && index === 0) || d.isMain,
            })),
        );
        refresh();
      },
    });
  };

  const setMainDepartment = async (dept: any) => {
    await api.resource('users').setMainDepartment({
      values: {
        userId: user.id,
        departmentId: dept.id,
      },
    });
    message.success(t('Set successfully'));
    field.setValue(
      field.value.map((d: any) => ({
        ...d,
        isMain: d.id === dept.id,
      })),
    );
    refresh();
  };

  const setOwner = async (dept: any) => {
    await api.resource('departments').setOwner({
      values: {
        userId: user.id,
        departmentId: dept.id,
      },
    });
    message.success(t('Set successfully'));
    field.setValue(
      field.value.map((d: any) => ({
        ...d,
        isOwner: d.id === dept.id ? true : d.isOwner,
      })),
    );
    refresh();
  };

  const removeOwner = async (dept: any) => {
    await api.resource('departments').removeOwner({
      values: {
        userId: user.id,
        departmentId: dept.id,
      },
    });
    message.success(t('Set successfully'));
    field.setValue(
      field.value.map((d: any) => ({
        ...d,
        isOwner: d.id === dept.id ? false : d.isOwner,
      })),
    );
    refresh();
  };

  const handleClick = (key: string, dept: any) => {
    switch (key) {
      case 'setMain':
        setMainDepartment(dept);
        break;
      case 'setOwner':
        setOwner(dept);
        break;
      case 'removeOwner':
        removeOwner(dept);
        break;
      case 'remove':
        removeDepartment(dept);
    }
  };

  const useDisabled = () => ({
    disabled: (record: any) => {
      return field.value.some((dept: any) => dept.id === record.id);
    },
  });

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <>
        {(field?.value || []).map((dept) => (
          <Tag style={{ padding: '5px 8px', background: 'transparent', marginBottom: '5px' }} key={dept.id}>
            <span style={{ marginRight: '5px' }}>{dept.title}</span>
            {dept.isMain ? (
              <Tag color="processing" bordered={false}>
                {t('Main')}
              </Tag>
            ) : (
              ''
            )}
            {/* {dept.isOwner ? ( */}
            {/*   <Tag color="gold" bordered={false}> */}
            {/*     {t('Owner')} */}
            {/*   </Tag> */}
            {/* ) : ( */}
            {/*   '' */}
            {/* )} */}
            <Dropdown
              menu={{
                items: [
                  ...(dept.isMain
                    ? []
                    : [
                        {
                          label: t('Set as main department'),
                          key: 'setMain',
                        },
                      ]),
                  // {
                  //   label: dept.isOwner ? t('Remove owner role') : t('Set as owner'),
                  //   key: dept.isOwner ? 'removeOwner' : 'setOwner',
                  // },
                  {
                    label: t('Remove'),
                    key: 'remove',
                  },
                ],
                onClick: ({ key }) => handleClick(key, dept),
              }}
            >
              <div style={{ float: 'right' }}>
                <MoreOutlined />
              </div>
            </Dropdown>
          </Tag>
        ))}
        <Button icon={<PlusOutlined />} onClick={() => setVisible(true)} />
      </>
      <SchemaComponent
        schema={userDepartmentsSchema}
        components={{ DepartmentTable }}
        scope={{ user, useDataSource, useAddDepartments, useDisabled }}
      />
    </ActionContextProvider>
  );
};
