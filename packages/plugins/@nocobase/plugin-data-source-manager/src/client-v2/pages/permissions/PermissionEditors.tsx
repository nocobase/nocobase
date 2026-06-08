/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table } from '@nocobase/client-v2';
import { css } from '@emotion/css';
import { useMemoizedFn } from 'ahooks';
import { Checkbox, Form, Select, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { compileLegacyTemplate } from '../../utils/compileLegacyTemplate';
import type { AvailableAction, CollectionFieldRecord, RoleResourceAction } from './types';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

function toStrategyScopes(value?: string[]) {
  const scopes: Record<string, string> = {};
  value?.forEach?.((item) => {
    const [name, scope] = item.split(':');
    if (name) {
      scopes[name] = scope || 'all';
    }
  });
  return scopes;
}

function toStrategyValue(scopes: Record<string, string>) {
  return Object.entries(scopes).map(([name, scope]) => (scope === 'all' ? name : `${name}:${scope}`));
}

function isEmptyScopeRecord(scope: unknown) {
  return Boolean(scope && typeof scope === 'object' && !Object.keys(scope as object).length);
}

export function normalizeActions(value?: RoleResourceAction[]) {
  const map: Record<string, RoleResourceAction> = {};
  value?.forEach?.((action) => {
    if (!action?.name) {
      return;
    }
    const appendedScope = isEmptyScopeRecord(action.scope) ? undefined : action.scope;
    const scope = appendedScope ?? (action.scopeId == null ? undefined : { id: action.scopeId });
    map[action.name] = {
      ...action,
      scope,
    };
  });
  return map;
}

function toActionValue(map: Record<string, RoleResourceAction>) {
  return Object.values(map).map((item) => ({
    ...item,
    scope: isEmptyScopeRecord(item.scope) ? null : item.scope,
  }));
}

function createActionWithDefaultFields(actionName: string, collectionFields: CollectionFieldRecord[]) {
  return {
    name: actionName,
    fields: collectionFields.map((field) => field.name),
  };
}

export function applyActionScope(
  actionMap: Record<string, RoleResourceAction>,
  actionName: string,
  scope: unknown,
  collectionFields: CollectionFieldRecord[],
) {
  return {
    ...actionMap,
    [actionName]: {
      ...(actionMap[actionName] || createActionWithDefaultFields(actionName, collectionFields)),
      scope,
    },
  };
}

function actionTypeTag(t: TFunction, onNewRecord?: boolean) {
  return onNewRecord ? (
    <Tag color="green">{t('Action on new records')}</Tag>
  ) : (
    <Tag color="geekblue">{t('Action on existing records')}</Tag>
  );
}

export interface StrategyActionsEditorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  availableActions: AvailableAction[];
  t: TFunction;
}

export function StrategyActionsEditor(props: StrategyActionsEditorProps) {
  const { token } = theme.useToken();
  const { value, onChange, availableActions, t } = props;
  const scopes = useMemo(() => toStrategyScopes(value), [value]);

  const dataSource = useMemo(
    () =>
      availableActions.map((item) => ({
        ...item,
        enabled: Boolean(scopes[item.name]),
        scope: scopes[item.name] || 'all',
      })),
    [availableActions, scopes],
  );

  const columns = useMemo<ColumnsType<AvailableAction & { enabled: boolean; scope: string }>>(
    () => [
      {
        title: t('Action display name'),
        dataIndex: 'displayName',
        width: token.sizeXXL * 4,
        render: (displayName) => compileLegacyTemplate(displayName, t),
      },
      {
        title: t('Action type'),
        dataIndex: 'onNewRecord',
        width: token.sizeXXL * 4,
        render: (onNewRecord) => actionTypeTag(t, onNewRecord),
      },
      {
        title: t('Allow'),
        dataIndex: 'enabled',
        align: 'center',
        width: token.sizeXXL * 2,
        render: (enabled, action) => (
          <Checkbox
            checked={enabled}
            onChange={() => {
              const next = { ...scopes };
              if (enabled) {
                delete next[action.name];
              } else {
                next[action.name] = 'all';
              }
              onChange?.(toStrategyValue(next));
            }}
          />
        ),
      },
      {
        title: t('Data scope'),
        dataIndex: 'scope',
        width: token.sizeXXL * 4,
        render: (scope, action) =>
          !action.onNewRecord ? (
            <Select
              data-testid="select-data-scope"
              popupMatchSelectWidth={false}
              size="small"
              value={scope}
              options={[
                { label: t('All records'), value: 'all' },
                { label: t('Own records'), value: 'own' },
              ]}
              onChange={(nextScope) => {
                const next = { ...scopes, [action.name]: nextScope };
                onChange?.(toStrategyValue(next));
              }}
            />
          ) : null,
      },
    ],
    [onChange, scopes, t, token.sizeXXL],
  );

  return (
    <Table
      rowKey="name"
      size="small"
      pagination={false}
      dataSource={dataSource}
      columns={columns}
      scroll={{ x: 'max-content' }}
    />
  );
}

export interface RoleResourceActionsEditorProps {
  value?: RoleResourceAction[];
  onChange?: (value: RoleResourceAction[]) => void;
  availableActions: AvailableAction[];
  collectionFields: CollectionFieldRecord[];
  renderScopeSelect: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    action: AvailableAction;
  }) => React.ReactNode;
  t: TFunction;
}

export function RoleResourceActionsEditor(props: RoleResourceActionsEditorProps) {
  const { token } = theme.useToken();
  const { value, onChange, availableActions, collectionFields, renderScopeSelect, t } = props;
  const fieldPermissionHeaderClassName = useMemo(
    () => css`
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      column-gap: ${token.marginXXS}px;
      align-items: center;
      white-space: nowrap;

      .ant-checkbox-wrapper {
        grid-column: 2;
      }

      .nb-field-permission-title {
        grid-column: 3;
      }
    `,
    [token.marginXXS],
  );
  const fieldPermissionCheckboxClassName = useMemo(
    () => css`
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    [],
  );
  const actionMap = useMemo(() => normalizeActions(value), [value]);
  const actionsWithFields = useMemo(
    () => availableActions.filter((action) => action.allowConfigureFields),
    [availableActions],
  );

  const emitChange = useMemoizedFn((nextMap: Record<string, RoleResourceAction>) => {
    onChange?.(toActionValue(nextMap));
  });

  const toggleAction = useMemoizedFn((actionName: string) => {
    const next = { ...actionMap };
    if (next[actionName]) {
      delete next[actionName];
    } else {
      next[actionName] = {
        name: actionName,
        fields: collectionFields.map((field) => field.name),
      };
    }
    emitChange(next);
  });

  const setScope = useMemoizedFn((actionName: string, scope: unknown) => {
    emitChange(applyActionScope(actionMap, actionName, scope, collectionFields));
  });

  const actionRows = useMemo(
    () =>
      availableActions.map((action) => ({
        ...action,
        enabled: Boolean(actionMap[action.name]),
        scope: actionMap[action.name]?.scope ?? null,
      })),
    [actionMap, availableActions],
  );

  const fieldRows = useMemo(
    () =>
      collectionFields.map((field) => {
        const row: CollectionFieldRecord & Record<string, unknown> = { ...field };
        actionsWithFields.forEach((action) => {
          row[action.name] = Boolean(actionMap[action.name]?.fields?.includes(field.name));
        });
        return row;
      }),
    [actionMap, actionsWithFields, collectionFields],
  );

  const actionColumns = useMemo<ColumnsType<AvailableAction & { enabled: boolean; scope: unknown }>>(
    () => [
      {
        title: t('Action display name'),
        dataIndex: 'displayName',
        width: token.sizeXXL * 4,
        render: (displayName) => compileLegacyTemplate(displayName, t),
      },
      {
        title: t('Action type'),
        dataIndex: 'onNewRecord',
        width: token.sizeXXL * 4,
        render: (onNewRecord) => actionTypeTag(t, onNewRecord),
      },
      {
        title: t('Allow'),
        dataIndex: 'enabled',
        align: 'center',
        width: token.sizeXXL * 2,
        render: (enabled, action) => <Checkbox checked={enabled} onChange={() => toggleAction(action.name)} />,
      },
      {
        title: t('Data scope'),
        dataIndex: 'scope',
        width: token.sizeXXL * 5,
        render: (scope, action) =>
          !action.onNewRecord
            ? renderScopeSelect({
                value: scope,
                onChange: (nextScope) => setScope(action.name, nextScope),
                action,
              })
            : null,
      },
    ],
    [renderScopeSelect, setScope, t, toggleAction, token.sizeXXL],
  );

  const fieldColumns = useMemo<ColumnsType<CollectionFieldRecord & Record<string, unknown>>>(
    () => [
      {
        title: t('Field display name'),
        dataIndex: ['uiSchema', 'title'],
        width: token.sizeXXL * 4,
        render: (title, record) => compileLegacyTemplate(title, t) || record.name,
      },
      ...actionsWithFields.map((action) => {
        const allChecked =
          collectionFields.length > 0 && collectionFields.length === actionMap[action.name]?.fields?.length;
        return {
          title: (
            <span className={fieldPermissionHeaderClassName}>
              <Checkbox
                checked={allChecked}
                onChange={() => {
                  const next = { ...actionMap };
                  const item = next[action.name] || { name: action.name };
                  item.fields = allChecked ? [] : collectionFields.map((field) => field.name);
                  next[action.name] = item;
                  emitChange(next);
                }}
              />
              <span className="nb-field-permission-title">{compileLegacyTemplate(action.displayName, t)}</span>
            </span>
          ),
          dataIndex: action.name,
          align: 'center' as const,
          width: token.sizeXXL * 3,
          render: (checked: boolean, field: CollectionFieldRecord) => (
            <span className={fieldPermissionCheckboxClassName}>
              <Checkbox
                checked={checked}
                onChange={() => {
                  const next = { ...actionMap };
                  const item = next[action.name] || { name: action.name };
                  const fields = [...(item.fields || [])];
                  if (checked) {
                    item.fields = fields.filter((fieldName) => fieldName !== field.name);
                  } else {
                    item.fields = Array.from(new Set([...fields, field.name]));
                  }
                  next[action.name] = item;
                  emitChange(next);
                }}
              />
            </span>
          ),
        };
      }),
    ],
    [
      actionMap,
      actionsWithFields,
      collectionFields,
      emitChange,
      fieldPermissionCheckboxClassName,
      fieldPermissionHeaderClassName,
      t,
      token.sizeXXL,
    ],
  );

  return (
    <>
      <Form.Item label={t('Action permission')}>
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          dataSource={actionRows}
          columns={actionColumns}
          scroll={{ x: 'max-content' }}
        />
      </Form.Item>
      <Form.Item label={t('Field permission')}>
        <Table rowKey="name" size="small" pagination={false} dataSource={fieldRows} columns={fieldColumns} />
      </Form.Item>
    </>
  );
}
