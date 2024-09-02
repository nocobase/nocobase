/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { createForm, Form, onFormValuesChange } from '@formily/core';
import { uid } from '@formily/shared';
import { SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import { RolesManagerContext } from '@nocobase/plugin-acl/client';
import { useMemoizedFn } from 'ahooks';
import { Checkbox, message, Table } from 'antd';
import { uniq } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMobileRoutes } from './mobile-providers';

interface MenuItem {
  title: string;
  id: number;
  children?: MenuItem[];
}

const style = css`
  .ant-table-cell {
    > .ant-space-horizontal {
      .ant-space-item-split:has(+ .ant-space-item:empty) {
        display: none;
      }
    }
  }
`;

const translateTitle = (menus: any[], t) => {
  return menus.map((menu) => {
    const title = t(menu.title);
    if (menu.children) {
      return {
        ...menu,
        title,
        children: translateTitle(menu.children, t),
      };
    }
    return {
      ...menu,
      title,
    };
  });
};

const findIDList = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  const IDList = [];
  for (const item of items) {
    IDList.push(item.id);
    IDList.push(...findIDList(item.children));
  }
  return IDList;
};
const getParentIDList = (tree, func, path = []) => {
  if (!tree) return [];
  for (const data of tree) {
    path.push(data.id);
    if (func(data)) return path;
    if (data.children) {
      const findChildren = getParentIDList(data.children, func, path);
      if (findChildren.length) return findChildren;
    }
    path.pop();
  }
  return [];
};
const getChildrenIDList = (data = [], arr = []) => {
  for (const item of data) {
    arr.push(item.id);
    if (item.children && item.children.length) getChildrenIDList(item.children, arr);
  }
  return arr;
};

const toItems = (items): MenuItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    return {
      title: item.title,
      id: item.id,
      children: toItems(item.children),
    };
  });
};

export const MenuPermissions: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const { routeList } = useMobileRoutes();
  const items = toItems(routeList);
  const { role, setRole } = useContext(RolesManagerContext);
  const api = useAPIClient();
  const { t } = useTranslation();
  const allIDList = findIDList(items);
  const [IDList, setIDList] = useState([]);
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.mobileMenuUiSchemas',
      resourceOf: role.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      ready: !!role && active,
      refreshDeps: [role?.name],
      onSuccess(data) {
        setIDList(data?.data?.map((item) => item['id']) || []);
      },
    },
  );
  const resource = api.resource('roles.mobileMenuUiSchemas', role.name);
  const allChecked = allIDList.length === IDList.length;

  const handleChange = async (checked, schema) => {
    const parentIDList = getParentIDList(items, (data) => data.id === schema.id);
    const childrenIDList = getChildrenIDList(schema?.children, []);
    if (checked) {
      const totalIDList = childrenIDList.concat(schema.id);
      const newIDList = IDList.filter((v) => !totalIDList.includes(v));
      setIDList([...newIDList]);
      await resource.remove({
        values: totalIDList,
      });
    } else {
      const totalIDList = childrenIDList.concat(parentIDList);
      setIDList((prev) => {
        return uniq([...prev, ...totalIDList]);
      });
      await resource.add({
        values: totalIDList,
      });
    }
    message.success(t('Saved successfully'));
  };

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
  return (
    <>
      <SchemaComponent
        schema={{
          type: 'void',
          name: uid(),
          'x-component': 'FormV2',
          'x-component-props': {
            form,
          },
          properties: {
            allowNewMobileMenu: {
              title: t('Menu permissions'),
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              'x-content': t('New menu items are allowed to be accessed by default.'),
            },
          },
        }}
      />

      <Table
        className={style}
        loading={loading}
        rowKey={'id'}
        pagination={false}
        expandable={{
          defaultExpandAllRows: true,
        }}
        columns={[
          {
            dataIndex: 'title',
            title: t('Menu item title'),
          },
          {
            dataIndex: 'accessible',
            title: (
              <>
                <Checkbox
                  checked={allChecked}
                  onChange={async (value) => {
                    if (allChecked) {
                      await resource.set({
                        values: [],
                      });
                    } else {
                      await resource.set({
                        values: allIDList,
                      });
                    }
                    refresh();
                    message.success(t('Saved successfully'));
                  }}
                />{' '}
                {t('Accessible')}
              </>
            ),
            render: (_, schema) => {
              const checked = IDList.includes(schema.id);
              return <Checkbox checked={checked} onChange={() => handleChange(checked, schema)} />;
            },
          },
        ]}
        dataSource={translateTitle(items, t)}
      />
    </>
  );
};
