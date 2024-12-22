/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, Form, onFormValuesChange } from '@formily/core';
import { uid } from '@formily/shared';
import { css, SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Checkbox, message, Table } from 'antd';
import _, { uniq } from 'lodash';
import React, { createContext, FC, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RolesManagerContext } from '../RolesManagerProvider';

const findUids = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  const uids = [];
  for (const item of items) {
    uids.push(item.uid);
    uids.push(...findUids(item.children));
  }
  return uids;
};
const getParentUids = (tree, func, path = []) => {
  if (!tree) return [];
  for (const data of tree) {
    path.push(data.uid);
    if (func(data)) return path;
    if (data.children) {
      const findChildren = getParentUids(data.children, func, path);
      if (findChildren.length) return findChildren;
    }
    path.pop();
  }
  return [];
};
const getChildrenUids = (data = [], arr = []) => {
  for (const item of data) {
    arr.push(item.uid);
    if (item.children && item.children.length) getChildrenUids(item.children, arr);
  }
  return arr;
};

interface MenuItem {
  title: string;
  id: number;
  children?: MenuItem[];
  parent?: MenuItem;
}

const toItems = (items, parent?: MenuItem): MenuItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const children = toItems(item.children, item);
    const hideChildren = children.length <= 1;

    return {
      title: item.title,
      id: item.id,
      children: hideChildren ? null : children,
      hideChildren,
      firstTabId: children[0]?.id,
      parent,
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
    if (item.hideChildren && !_.isNil(item.firstTabId)) {
      IDList.push(item.firstTabId);
    }
    IDList.push(...findIDList(item.children));
  }
  return IDList;
};

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

const DesktopRoutesContext = createContext<{ routeList: any[] }>({ routeList: [] });

const useDesktopRoutes = () => {
  return useContext(DesktopRoutesContext);
};

const DesktopRoutesProvider: FC<{
  refreshRef?: any;
}> = ({ children, refreshRef }) => {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource('desktopRoutes'), [api]);
  const { data, runAsync: refresh } = useRequest<{ data: any[] }>(
    () => resource.list({ tree: true, sort: 'sort' }).then((res) => res.data),
    {
      manual: true,
    },
  );

  if (refreshRef) {
    refreshRef.current = refresh;
  }

  const routeList = useMemo(() => data?.data || [], [data]);

  const value = useMemo(() => ({ routeList }), [routeList]);

  return <DesktopRoutesContext.Provider value={value}>{children}</DesktopRoutesContext.Provider>;
};

export const DesktopAllRoutesProvider: React.FC<{ active: boolean }> = ({ children, active }) => {
  const refreshRef = React.useRef(() => {});

  useEffect(() => {
    if (active) {
      refreshRef.current?.();
    }
  }, [active]);

  return <DesktopRoutesProvider refreshRef={refreshRef}>{children}</DesktopRoutesProvider>;
};

export const MenuPermissions: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const { routeList } = useDesktopRoutes();
  const items = toItems(routeList);
  const { role, setRole } = useContext(RolesManagerContext);
  const api = useAPIClient();
  const { t } = useTranslation();
  const allIDList = findIDList(items);
  const [IDList, setIDList] = useState([]);
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.desktopRoutes',
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
  const resource = api.resource('roles.desktopRoutes', role.name);
  const allChecked = allIDList.length === IDList.length;

  const handleChange = async (checked, menuItem) => {
    if (checked) {
      let newIDList = IDList.filter((id) => id !== menuItem.id);
      const shouldRemove = [menuItem.id];

      if (menuItem.parent) {
        const selectedChildren = menuItem.parent.children.filter((item) => newIDList.includes(item.id));
        if (selectedChildren.length === 0) {
          newIDList = newIDList.filter((id) => id !== menuItem.parent.id);
          shouldRemove.push(menuItem.parent.id);
        }
      }

      if (menuItem.children) {
        newIDList = newIDList.filter((id) => !menuItem.children.map((item) => item.id).includes(id));
        shouldRemove.push(...menuItem.children.map((item) => item.id));
      }

      if (menuItem.hideChildren && !_.isNil(menuItem.firstTabId)) {
        shouldRemove.push(menuItem.firstTabId);
        newIDList = newIDList.filter((id) => id !== menuItem.firstTabId);
      }

      setIDList(newIDList);
      await resource.remove({
        values: shouldRemove,
      });
    } else {
      const newIDList = [...IDList, menuItem.id];
      const shouldAdd = [menuItem.id];

      if (menuItem.parent) {
        if (!newIDList.includes(menuItem.parent.id)) {
          newIDList.push(menuItem.parent.id);
          shouldAdd.push(menuItem.parent.id);
        }
      }

      if (menuItem.children) {
        const childrenIDList = menuItem.children.map((item) => item.id);
        newIDList.push(...childrenIDList);
        shouldAdd.push(...childrenIDList);
      }

      if (menuItem.hideChildren && !_.isNil(menuItem.firstTabId)) {
        shouldAdd.push(menuItem.firstTabId);
        newIDList.push(menuItem.firstTabId);
      }

      setIDList(uniq(newIDList));
      await resource.add({
        values: shouldAdd,
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
            allowNewMenu: {
              title: t('Route permissions'),
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              'x-content': t('New routes are allowed to be accessed by default'),
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
            title: t('Route name'),
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
