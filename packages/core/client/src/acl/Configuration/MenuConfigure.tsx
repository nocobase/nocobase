/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, message, Table, TableProps } from 'antd';
import { uniq } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { antTableCell } from '../style';
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

export const MenuConfigure = () => {
  const record = useRecord();
  const api = useAPIClient();
  const { items } = useMenuItems();
  const { t } = useTranslation();
  const allUids = findUids(items);
  const [uids, setUids] = useState([]);
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.menuUiSchemas',
      resourceOf: record.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      onSuccess(data) {
        setUids(data?.data?.map((schema) => schema['x-uid']) || []);
      },
    },
  );
  const resource = api.resource('roles.menuUiSchemas', record.name);
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

  return (
    <Table
      className={antTableCell}
      loading={loading}
      rowKey={'uid'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={
        [
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
            render: (_, schema: { uid: string }) => {
              const checked = uids.includes(schema.uid);
              return <Checkbox checked={checked} onChange={() => handleChange(checked, schema)} />;
            },
          },
        ] as TableProps['columns']
      }
      dataSource={translateTitle(items)}
    />
  );
};
