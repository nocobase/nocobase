/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table, type PluginSettingsPageType } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { useT } from '../../locale';
import type { Role } from '../../registries';
import { getSettingsChildren, toRoleSnippetsPayload, translateTitle } from './utils';

interface PluginPermissionsTableProps {
  active: boolean;
  role: Role;
}

function normalizeSettingsItems(items: PluginSettingsPageType[]): PluginSettingsPageType[] {
  return items.map((item) => {
    const children = (item.children ?? []).filter((child) => child.key !== item.key && child.title !== item.title);
    if (!children.length) {
      return { ...item, children: undefined };
    }
    return { ...item, children };
  });
}

function flattenSettings(items: PluginSettingsPageType[]) {
  return items.flatMap((item) => (item.children ? [item, ...item.children] : [item]));
}

function getChildrenAclSnippets(item: PluginSettingsPageType, result: string[] = []) {
  getSettingsChildren(item).forEach((child) => {
    if (child.aclSnippet) {
      result.push(child.aclSnippet);
    }
    getChildrenAclSnippets(child, result);
  });
  return result;
}

function getDeniedSnippets(item: PluginSettingsPageType) {
  return [item.aclSnippet, ...getChildrenAclSnippets(item)].filter(Boolean).map((snippet) => `!${snippet}`);
}

export default function PluginPermissionsTable(props: PluginPermissionsTableProps) {
  const ctx = useFlowContext();
  const t = useT();
  const settings = useMemo(() => normalizeSettingsItems(ctx.app.pluginSettingsManager.getList(false)), [ctx.app]);
  const allAclSnippets = ctx.app.pluginSettingsManager.getAclSnippets();
  const flatSettings = useMemo(() => flattenSettings(settings), [settings]);
  const [snippets, setSnippets] = useState<string[]>(props.role.snippets ?? []);
  const resource = ctx.api.resource('roles.snippets', props.role.name);

  const { loading, refreshAsync } = useRequest(
    async () => {
      const response = await resource.list({ paginate: false });
      return toRoleSnippetsPayload(response?.data).data ?? [];
    },
    {
      ready: props.active && !!props.role.name,
      refreshDeps: [props.role.name],
      onSuccess(data) {
        setSnippets(
          data.filter((snippet) => {
            return flatSettings.find((item) => snippet.includes(`!${item.aclSnippet}`) || !snippet.startsWith('!pm.'));
          }),
        );
      },
    },
  );

  const allChecked = snippets.includes('pm.*') && snippets.every((item) => !item.startsWith('!pm.'));

  const columns = useMemo<ColumnsType<PluginSettingsPageType>>(
    () => [
      {
        dataIndex: 'title',
        title: t('Plugin name'),
        render: (value) => translateTitle(value, t),
      },
      {
        dataIndex: 'accessible',
        title: (
          <Checkbox
            checked={allChecked}
            onChange={async () => {
              const values = allAclSnippets.map((snippet) => `!${snippet}`);
              if (allChecked) {
                await resource.add({ values });
              } else {
                await resource.remove({ values });
              }
              await refreshAsync();
              ctx.message.success(t('Saved successfully'));
            }}
          >
            {t('Allow access')}
          </Checkbox>
        ),
        render: (_, record) => {
          const deniedSnippets = getDeniedSnippets(record);
          const accessible = deniedSnippets.every((snippet) => !snippets.includes(snippet));
          return (
            <Checkbox
              checked={accessible}
              onChange={async () => {
                if (accessible) {
                  await resource.add({ values: deniedSnippets });
                } else {
                  await resource.remove({ values: deniedSnippets });
                }
                await refreshAsync();
                ctx.message.success(t('Saved successfully'));
              }}
            />
          );
        },
      },
    ],
    [allAclSnippets, allChecked, ctx.message, refreshAsync, resource, snippets, t],
  );

  const dataSource = settings
    .filter((item) => item.isTopLevel !== false)
    .map((item) => {
      if (item.showTabs !== false) {
        return item;
      }
      const { children, ...rest } = item;
      return rest;
    });

  return (
    <Table<PluginSettingsPageType>
      loading={loading}
      rowKey="key"
      pagination={false}
      expandable={{ defaultExpandAllRows: true }}
      columns={columns}
      dataSource={dataSource}
    />
  );
}
