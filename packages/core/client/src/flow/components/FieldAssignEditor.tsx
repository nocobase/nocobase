/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Select } from 'antd';
import { FieldAssignValueInput } from './FieldAssignValueInput';

export interface FieldAssignEditorProps {
  t: (key: string) => string;
  fieldOptions: Array<{ label: string; value: string }>;
  /** 赋值目标路径（例如 `title` / `user.name`） */
  field?: string;
  onFieldChange: (targetPath?: string) => void;
  value: any;
  onValueChange: (value: any) => void;
  fieldLabel?: React.ReactNode;
  valueLabel?: React.ReactNode;
  showValueEditorWhenNoField?: boolean;
}

/**
 * 通用“字段赋值”编辑器：
 * - 选择字段
 * - 编辑赋值（支持变量引用 + 常量）
 *
 * 可在“表单赋值配置”和“联动规则赋值动作”等场景复用。
 */
export const FieldAssignEditor: React.FC<FieldAssignEditorProps> = (props) => {
  const {
    t,
    fieldOptions,
    field,
    onFieldChange,
    value,
    onValueChange,
    fieldLabel,
    valueLabel,
    showValueEditorWhenNoField = false,
  } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ marginBottom: 4, fontSize: 14 }}>{fieldLabel ?? t('Field')}</div>
        <Select
          value={field}
          placeholder={t('Please select field')}
          style={{ width: '100%' }}
          options={fieldOptions}
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          allowClear
          onChange={(next) => onFieldChange?.(next)}
        />
      </div>

      {(showValueEditorWhenNoField || !!field) && (
        <div>
          <div style={{ marginBottom: 4, fontSize: 14 }}>{valueLabel ?? t('Fixed value')}</div>
          <FieldAssignValueInput
            key={field || 'no-field'}
            targetPath={field || ''}
            value={value}
            onChange={onValueChange}
          />
        </div>
      )}
    </div>
  );
};
