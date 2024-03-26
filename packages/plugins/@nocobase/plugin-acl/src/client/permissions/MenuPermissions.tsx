import { Checkbox, message, Table } from 'antd';
import { onFormValuesChange, createForm, Form } from '@formily/core';
import { uniq } from 'lodash';
import React, { useContext, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { uid } from '@formily/shared';
import { useAPIClient, SchemaComponent, useRequest } from '@nocobase/client';
import { useStyles } from './style';
import { useMemoizedFn } from 'ahooks';
import { RolesManagerContext } from '../RolesManagerProvider';
import { useMenuItems } from './MenuItemsProvider';

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

export const MenuPermissions: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const { styles } = useStyles();
  const { role, setRole } = useContext(RolesManagerContext);
  const api = useAPIClient();
  const { items } = useMenuItems();
  const { t } = useTranslation();
  const allUids = findUids(items);
  const [uids, setUids] = useState([]);
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.menuUiSchemas',
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
        setUids(data?.data?.map((schema) => schema['x-uid']) || []);
      },
    },
  );
  const resource = api.resource('roles.menuUiSchemas', role.name);
  const allChecked = allUids.length === uids.length;

  const handleChange = async (checked, schema) => {
    const parentUids = getParentUids(items, (data) => data.uid === schema.uid);
    const childrenUids = getChildrenUids(schema?.children, []);
    if (checked) {
      const totalUids = childrenUids.concat(schema.uid);
      const newUids = uids.filter((v) => !totalUids.includes(v));
      setUids([...newUids]);
      await resource.remove({
        values: totalUids,
      });
    } else {
      const totalUids = childrenUids.concat(parentUids);
      setUids((prev) => {
        return uniq([...prev, ...totalUids]);
      });
      await resource.add({
        values: totalUids,
      });
    }
    message.success(t('Saved successfully'));
  };

  const translateTitle = (menus: any[]) => {
    return menus.map((menu) => {
      const title = t(menu.title);
      if (menu.children) {
        return {
          ...menu,
          title,
          children: translateTitle(menu.children),
        };
      }
      return {
        ...menu,
        title,
      };
    });
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
              title: t('Menu permissions'),
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              'x-content': t('New menu items are allowed to be accessed by default.'),
            },
          },
        }}
      />

      <Table
        className={styles}
        loading={loading}
        rowKey={'uid'}
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
                        values: allUids,
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
              const checked = uids.includes(schema.uid);
              return <Checkbox checked={checked} onChange={() => handleChange(checked, schema)} />;
            },
          },
        ]}
        dataSource={translateTitle(items)}
      />
    </>
  );
};
