/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Button, Dropdown, Input, Select, Space } from 'antd';
import type { MenuProps } from 'antd';
import { useAntdToken } from 'antd-style';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { uid } from '@formily/shared';

interface ValidationRule {
  key: string;
  name: string;
  value?: string;
  [key: string]: any;
}

interface FieldValidationProps {
  value?: ValidationRule[];
  onChange?: (value: ValidationRule[]) => void;
  type?: string; // 验证类型，来自 x-component-props
}

// Joi 验证函数映射
const VALIDATION_OPTIONS = {
  string: [
    { key: 'max', label: 'Max' },
    { key: 'min', label: 'Min' },
    { key: 'required', label: 'Required' },
    { key: 'length', label: 'Length' },
    { key: 'pattern', label: 'Pattern' },
    { key: 'email', label: 'Email' },
    { key: 'url', label: 'URL' },
  ],
  number: [
    { key: 'max', label: 'Max' },
    { key: 'min', label: 'Min' },
    { key: 'required', label: 'Required' },
    { key: 'integer', label: 'Integer' },
    { key: 'positive', label: 'Positive' },
    { key: 'negative', label: 'Negative' },
  ],
  email: [
    { key: 'required', label: 'Required' },
    { key: 'max', label: 'Max' },
    { key: 'min', label: 'Min' },
  ],
  url: [
    { key: 'required', label: 'Required' },
    { key: 'max', label: 'Max' },
    { key: 'min', label: 'Min' },
  ],
};

export const FieldValidation = observer((props: FieldValidationProps) => {
  const { value = [], onChange, type } = props;
  const { t } = useTranslation();
  const token = useAntdToken();

  const styles = useMemo(() => {
    return {
      container: {
        marginBottom: token.marginLG,
      },
      label: {
        color: token.colorText,
        fontSize: token.fontSize,
        fontWeight: 500,
        marginBottom: token.marginXS,
      },
      validationContainer: {
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        padding: token.paddingSM,
        backgroundColor: token.colorFillAlter,
        minHeight: 40,
      },
      ruleItem: {
        marginBottom: token.marginSM,
      },
      ruleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: token.marginSM,
        marginBottom: token.marginSM,
      },
      ruleSelect: {
        minWidth: 120,
      },
      ruleInput: {
        flex: 1,
      },
      removeButton: {
        cursor: 'pointer',
        color: token.colorTextSecondary,
        fontSize: token.fontSizeLG,
        padding: token.paddingXXS,
        '&:hover': {
          color: token.colorError,
        },
      },
    };
  }, [token]);

  // 获取当前类型对应的验证选项
  const validationOptions = useMemo(() => {
    return VALIDATION_OPTIONS[type] || VALIDATION_OPTIONS.string;
  }, [type]);

  const handleAddRule = (ruleType: string) => {
    const newRule: ValidationRule = {
      key: `r_${uid()}`,
      name: ruleType,
      value: '',
    };

    const newValue = [...value, newRule];
    onChange?.(newValue);
  };

  const handleRemoveRule = (ruleKey: string) => {
    const newValue = value.filter((rule) => rule.key !== ruleKey);
    onChange?.(newValue);
  };

  const handleRuleChange = (ruleKey: string, field: string, fieldValue: any) => {
    const newValue = value.map((rule) => (rule.key === ruleKey ? { ...rule, [field]: fieldValue } : rule));
    onChange?.(newValue);
  };

  const menuItems: MenuProps['items'] = useMemo(() => {
    return validationOptions.map((option) => ({
      key: option.key,
      label: t(option.label),
    }));
  }, [validationOptions, t]);

  const menu: MenuProps = {
    items: menuItems,
    onClick: ({ key }) => {
      handleAddRule(key as string);
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>{t('Validation')}:</div>

      <div style={styles.validationContainer}>
        {value.map((rule) => {
          const needsValue = !['required'].includes(rule.name);
          return (
            <div key={rule.key} style={styles.ruleRow}>
              <Select
                value={rule.name}
                onChange={(newType) => handleRuleChange(rule.key, 'name', newType)}
                style={styles.ruleSelect}
                options={validationOptions.map((opt) => ({
                  value: opt.key,
                  label: t(opt.label),
                }))}
                size="small"
              />

              {needsValue && (
                <Input
                  value={rule.value}
                  onChange={(e) => handleRuleChange(rule.key, 'value', e.target.value)}
                  placeholder={t('Enter value')}
                  style={styles.ruleInput}
                  size="small"
                />
              )}

              <CloseOutlined style={styles.removeButton} onClick={() => handleRemoveRule(rule.key)} />
            </div>
          );
        })}

        <Dropdown menu={menu} placement="bottomLeft">
          <Button type="dashed" icon={<PlusOutlined />} size="small">
            {t('Add rule')} <DownOutlined />
          </Button>
        </Dropdown>
      </div>
    </div>
  );
});

FieldValidation.displayName = 'FieldValidation';
