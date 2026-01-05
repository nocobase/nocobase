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
import { FilterGroupType } from '@nocobase/utils/client';
import { Button, Collapse, Empty, Select, Space, Switch } from 'antd';
import React from 'react';
import { ConditionBuilder } from './ConditionBuilder';
import { FieldAssignEditor } from './FieldAssignEditor';

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
        condition: { logic: '$and', items: [] },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {value.length ? (
        <Collapse
          size="small"
          items={value.map((it, index) => {
            const mode = getEffectiveMode(it);
            const fieldLabel = (fieldOptions as any[])?.find((o) => o?.value === it.field)?.label;
            const title = fieldLabel ? String(fieldLabel) : t('Please select field');
            return {
              key: it.key || String(index),
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {showEnable && (
                    <Switch
                      checked={it.enable !== false}
                      onChange={(checked) => patchItem(index, { enable: checked })}
                      size="small"
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                  <div style={{ opacity: 0.65, fontSize: 12 }}>
                    {mode === 'default' ? t('Default value') : t('Assign value')}
                  </div>
                </div>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FieldAssignEditor
                    t={t}
                    fieldOptions={fieldOptions}
                    field={it.field}
                    value={it.value}
                    fieldLabel={t('Field')}
                    valueLabel={t('Value')}
                    showValueEditorWhenNoField={showValueEditorWhenNoField}
                    onFieldChange={(fieldUid) => {
                      const changed = fieldUid !== it.field;
                      patchItem(index, {
                        field: fieldUid,
                        value: changed ? undefined : it.value,
                      });
                    }}
                    onValueChange={(v) => patchItem(index, { value: v })}
                  />

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
                        value={(it.condition || { logic: '$and', items: [] }) as any}
                        onChange={(condition) => patchItem(index, { condition })}
                      />
                    </div>
                  )}

                  <Space>
                    <Button icon={<ArrowUpOutlined />} onClick={() => moveItem(index, 'up')} />
                    <Button icon={<ArrowDownOutlined />} onClick={() => moveItem(index, 'down')} />
                    <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
                  </Space>
                </div>
              ),
            };
          })}
        />
      ) : (
        <Empty description={t('No data')} />
      )}

      <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>
        {t('Add')}
      </Button>
    </div>
  );
};
