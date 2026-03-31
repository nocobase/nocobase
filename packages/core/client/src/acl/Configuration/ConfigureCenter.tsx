/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, message, Table, TableProps } from 'antd';
import { omit } from 'lodash';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useApp } from '../../application';
import { SettingsCenterContext } from '../../pm';
import { useRecord } from '../../record-provider';
import { useCompile } from '../../schema-component';
import { antTableCell } from '../style';

const getParentKeys = (tree, func, path = []) => {
  if (!tree) return [];
  for (const data of tree) {
    path.push(data.key);
    if (func(data)) return path;
    if (data.children) {
      const findChildren = getParentKeys(data.children, func, path);
      if (findChildren.length) return findChildren;
    }
    path.pop();
  }
  return [];
};
const getChildrenKeys = (data = [], arr = []) => {
  for (const item of data) {
    arr.push(item.aclSnippet);
    if (item.children && item.children.length) getChildrenKeys(item.children, arr);
  }
  return arr;
};

const SettingMenuContext = createContext(null);
SettingMenuContext.displayName = 'SettingMenuContext';

export const SettingCenterProvider = (props) => {
  const configureItems = useContext(SettingsCenterContext);
  return <SettingMenuContext.Provider value={configureItems}>{props.children}</SettingMenuContext.Provider>;
};

export const SettingsCenterConfigure = () => {
  const app = useApp();
  const record = useRecord();
  const api = useAPIClient();
  const compile = useCompile();
  const settings = app.pluginSettingsManager.getList(false);
  const allAclSnippets = app.pluginSettingsManager.getAclSnippets();
  const [snippets, setSnippets] = useState<string[]>([]);
  const allChecked = useMemo(
    () => snippets.includes('pm.*') && snippets.every((item) => !item.startsWith('!pm.')),
    [snippets],
  );

  const { t } = useTranslation();
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.snippets',
      resourceOf: record.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      onSuccess(data) {
        setSnippets(data?.data || []);
      },
    },
  );
  const resource = api.resource('roles.snippets', record.name);
  const handleChange = async (checked, record) => {
    const childrenKeys = getChildrenKeys(record?.children, []);
    const totalKeys = childrenKeys.concat(record.aclSnippet);
    if (!checked) {
      await resource.remove({
        values: totalKeys.map((v) => '!' + v),
      });
      refresh();
    } else {
      await resource.add({
        values: totalKeys.map((v) => '!' + v),
      });
      refresh();
    }
    message.success(t('Saved successfully'));
  };
  return (
    <Table
      className={antTableCell}
      loading={loading}
      rowKey={'key'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={
        [
          {
            dataIndex: 'title',
            title: t('Plugin name'),
            render: (value) => {
              return compile(value);
            },
          },
          {
            dataIndex: 'accessible',
            title: (
              <>
                <Checkbox
                  checked={allChecked}
                  onChange={async () => {
                    const values = allAclSnippets.map((v) => '!' + v);
                    if (!allChecked) {
                      await resource.remove({
                        values,
                      });
                    } else {
                      await resource.add({
                        values,
                      });
                    }
                    refresh();
                    message.success(t('Saved successfully'));
                  }}
                />{' '}
                {t('Accessible')}
              </>
            ),
            render: (_, record) => {
              const checked = !snippets.includes('!' + record.aclSnippet);
              return <Checkbox checked={checked} onChange={() => handleChange(checked, record)} />;
            },
          },
        ] as TableProps['columns']
      }
      dataSource={settings
        .filter((v) => {
          return v.isTopLevel !== false;
        })
        .map((v) => {
          if (v.showTabs !== false) {
            return v;
          }
          return omit(v, 'children');
        })}
    />
  );
};
