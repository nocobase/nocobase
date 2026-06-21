/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowContext, useFlowContext } from '@nocobase/flow-engine';
import { Checkbox, Typography, theme } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
import type { PermissionTabProps, Role } from '../../registries';
import PluginPermissionsTable from './PluginPermissionsTable';
import { mergeRoleSnippets } from './utils';

const systemSnippets = ['ui.*', 'pm', 'pm.*', 'app'];

function replaceSystemSnippet(snippets: string[], key: string, checked: boolean) {
  const next = snippets.filter((snippet) => snippet !== key && snippet !== `!${key}`);
  next.push(checked ? key : `!${key}`);
  systemSnippets.forEach((snippet) => {
    if (!next.includes(snippet) && !next.includes(`!${snippet}`)) {
      next.push(`!${snippet}`);
    }
  });
  return Array.from(new Set(next));
}

async function saveSnippets(ctx: FlowContext, role: Role, snippets: string[]) {
  await ctx.api.resource('roles').update({
    filterByTk: role.name,
    values: { snippets },
  });
}

export default function SystemPermissionsTab(props: PermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const [savingKey, setSavingKey] = useState<string>();
  const [snippets, setSnippets] = useState<string[]>(role?.snippets ?? []);

  useEffect(() => {
    setSnippets(role?.snippets ?? []);
  }, [role?.name, role?.snippets]);

  const options = useMemo(
    () => [
      { key: 'ui.*', label: t('Allows to configure interface') },
      { key: 'pm', label: t('Allows to install, activate, disable plugins') },
      { key: 'pm.*', label: t('Allows to configure plugins') },
      { key: 'app', label: t('Allows to clear cache, reboot application') },
    ],
    [t],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  const canConfigurePlugins = snippets.includes('pm.*');

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginSM,
      }}
    >
      <Typography.Text strong>{t('Configure permissions')}</Typography.Text>
      <Checkbox.Group value={snippets.filter((snippet) => systemSnippets.includes(snippet))}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: token.marginXS }}>
          {options.map((item) => (
            <Checkbox
              key={item.key}
              value={item.key}
              disabled={!!savingKey}
              onChange={async (event) => {
                const nextSnippets = replaceSystemSnippet(snippets, item.key, event.target.checked);
                setSnippets(nextSnippets);
                setSavingKey(item.key);
                try {
                  await saveSnippets(ctx, role, nextSnippets);
                  props.onRoleChange(mergeRoleSnippets(role, nextSnippets));
                  ctx.message.success(t('Saved successfully'));
                } finally {
                  setSavingKey(undefined);
                }
              }}
            >
              {item.label}
            </Checkbox>
          ))}
        </div>
      </Checkbox.Group>
      {canConfigurePlugins ? (
        <>
          <Typography.Text strong>{t('Plugin settings')}</Typography.Text>
          <PluginPermissionsTable active={props.activeKey === 'general'} role={mergeRoleSnippets(role, snippets)} />
        </>
      ) : null}
    </div>
  );
}
