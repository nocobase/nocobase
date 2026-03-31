/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp, useCompile, useRequest } from '@nocobase/client';
import { Checkbox, message, Table, TableProps } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { flatMap } from 'lodash';
import { useStyles } from './style';
import { RolesManagerContext } from '../RolesManagerProvider';
import lodash from 'lodash';

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

export const PluginPermissions: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const app = useApp();
  const { styles } = useStyles();
  const { role } = useContext(RolesManagerContext);
  const api = useAPIClient();
  const compile = useCompile();
  const settings = app.pluginSettingsManager.getList(false);
  const allAclSnippets = app.pluginSettingsManager.getAclSnippets();
  const [snippets, setSnippets] = useState<string[]>(role?.snippets || []);
  const flatPlugins = useMemo(() => {
    return flatMap(settings, (item) => {
      if (item.children) {
        return [item, ...item.children];
      } else {
        return item;
      }
    });
  }, [settings]);
  const allChecked = useMemo(
    () => snippets.includes('pm.*') && snippets.every((item) => !item.startsWith('!pm.')),
    [snippets],
  );
  const { t } = useTranslation();
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.snippets',
      resourceOf: role?.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      ready: !!role && active,
      refreshDeps: [role?.name],
      manual: true,
      onSuccess(data) {
        setSnippets(
          data?.data.filter((v) => {
            return flatPlugins.find((k) => v.includes(`!${k.aclSnippet}`) || !v.startsWith('!pm.'));
          }) || [],
        );
      },
    },
  );
  if (!role) {
    return;
  }
  const resource = api.resource('roles.snippets', role?.name);
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
      className={styles}
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
                />
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
          return lodash.omit(v, 'children');
        })}
    />
  );
};
