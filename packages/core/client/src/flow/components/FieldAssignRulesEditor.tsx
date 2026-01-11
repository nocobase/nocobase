/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import type { FilterGroupType } from '@nocobase/utils/client';
import { Button, Collapse, Empty, Select, Space, Switch, Tooltip } from 'antd';
import React from 'react';
import { ConditionBuilder } from './ConditionBuilder';
import { FieldAssignValueInput } from './FieldAssignValueInput';

export type AssignMode = 'default' | 'assign';

export interface FieldAssignRuleItem {
  key: string;
  enable?: boolean;
  field?: string;
  mode?: AssignMode;
  condition?: FilterGroupType;
  value?: any;
}

export interface FieldAssignRulesEditorProps {
  t: (key: string) => string;
  fieldOptions: Array<{ label: any; value: string }> | any[];
  value?: FieldAssignRuleItem[];
  onChange?: (value: FieldAssignRuleItem[]) => void;

  /** 默认 mode（新建条目时使用） */
  defaultMode?: AssignMode;
  /** 固定 mode：用于“仅默认值/仅赋值”的场景 */
  fixedMode?: AssignMode;
  /** 是否显示 condition */
  showCondition?: boolean;
  /** 是否显示 enable 开关 */
  showEnable?: boolean;
  /** 未选字段时也展示 Value 编辑器（用于表单设置里的占位体验） */
  showValueEditorWhenNoField?: boolean;
}

export const FieldAssignRulesEditor: React.FC<FieldAssignRulesEditorProps> = (props) => {
  const {
    t,
    fieldOptions,
    value: rawValue,
    onChange,
    defaultMode = 'assign',
    fixedMode,
    showCondition = true,
    showEnable = true,
    showValueEditorWhenNoField = false,
  } = props;

  const value = Array.isArray(rawValue) ? rawValue : [];

  const patchItem = (index: number, patch: Partial<FieldAssignRuleItem>) => {
    const next = value.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange?.(next);
  };

  const removeItem = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange?.(next);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const next = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    onChange?.(next);
  };

  const addItem = () => {
    const next: FieldAssignRuleItem[] = [
      ...value,
      {
        key: uid(),
        enable: true,
        mode: fixedMode || defaultMode,
        condition: { logic: '$and', items: [] } as any,
        field: undefined,
        value: undefined,
      },
    ];
    onChange?.(next);
  };

  const getEffectiveMode = (item: FieldAssignRuleItem): AssignMode => {
    if (fixedMode) return fixedMode;
    return item?.mode === 'default' ? 'default' : 'assign';
  };

  const getFieldLabel = (fieldUid?: string) => {
    if (!fieldUid) return undefined;
    return (fieldOptions as any[])?.find((o) => String(o?.value) === String(fieldUid))?.label;
  };

  const renderPanelHeader = (item: FieldAssignRuleItem, index: number) => {
    const mode = getEffectiveMode(item);
    const modeText = mode === 'default' ? t('Default value') : t('Assign value');
    const fieldLabel = getFieldLabel(item.field);
    const title = fieldLabel ? String(fieldLabel) : t('Please select field');

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div
          style={{
            flex: 1,
            marginRight: 16,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>
            {title}
          </div>
          <div style={{ opacity: 0.65, fontSize: 12, whiteSpace: 'nowrap' }}>{modeText}</div>
        </div>
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('Delete')}>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeItem(index)}
              aria-label={t('Delete')}
            />
          </Tooltip>
          <Tooltip title={t('Move up')}>
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => moveItem(index, 'up')}
              disabled={index === 0}
              aria-label={t('Move up')}
            />
          </Tooltip>
          <Tooltip title={t('Move down')}>
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => moveItem(index, 'down')}
              disabled={index === value.length - 1}
              aria-label={t('Move down')}
            />
          </Tooltip>
          {showEnable && (
            <Switch
              size="small"
              checked={item.enable !== false}
              onChange={(checked) => patchItem(index, { enable: checked })}
              checkedChildren={t('Enable')}
              unCheckedChildren={t('Disable')}
            />
          )}
        </Space>
      </div>
    );
  };

  const collapseItems = value.map((item, index) => {
    const mode = getEffectiveMode(item);
    return {
      key: item.key || String(index),
      label: renderPanelHeader(item, index),
      styles: {
        header: {
          display: 'flex',
          alignItems: 'center',
        },
      },
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Field')}</div>
            <Select
              value={item.field}
              placeholder={t('Please select field')}
              style={{ width: '100%' }}
              options={fieldOptions}
              showSearch
              // @ts-ignore
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(String(input ?? '').toLowerCase())
              }
              allowClear
              onChange={(fieldUid) => {
                const changed = fieldUid !== item.field;
                patchItem(index, {
                  field: fieldUid,
                  value: changed ? undefined : item.value,
                });
              }}
            />
          </div>

          {(showValueEditorWhenNoField || !!item.field) && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Value')}</div>
              <FieldAssignValueInput
                key={item.field || 'no-field'}
                fieldUid={item.field || ''}
                value={item.value}
                onChange={(v) => patchItem(index, { value: v })}
              />
            </div>
          )}

          {!fixedMode && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Assignment mode')}</div>
              <Select
                value={mode}
                style={{ width: '100%' }}
                options={[
                  { label: t('Default value'), value: 'default' },
                  { label: t('Assign value'), value: 'assign' },
                ]}
                onChange={(nextMode) => patchItem(index, { mode: nextMode })}
              />
            </div>
          )}

          {showCondition && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Condition')}</div>
              <ConditionBuilder
                value={(item.condition || ({ logic: '$and', items: [] } as any)) as any}
                onChange={(condition) => patchItem(index, { condition })}
              />
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {value.length ? (
        <Collapse
          items={collapseItems as any}
          size="small"
          style={{ marginBottom: 8 }}
          defaultActiveKey={value.length > 0 ? [value[0].key] : []}
          accordion
        />
      ) : (
        <div
          style={{
            border: '1px dashed #d9d9d9',
            borderRadius: 6,
            backgroundColor: '#fafafa',
            marginBottom: 8,
          }}
        >
          <Empty description={t('No data')} style={{ margin: '20px 0' }} />
        </div>
      )}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addItem} style={{ width: '100%' }}>
        {t('Add')}
      </Button>
    </div>
  );
};
