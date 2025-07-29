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

interface ValidationRule {
  key: string;
  name: string;
  args?: {
    [key: string]: any;
  };
}

interface ValidationData {
  type: string;
  rules: ValidationRule[];
}

interface FieldValidationProps {
  value?: ValidationData;
  onChange?: (value: ValidationData) => void;
  type?: string;
}

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
  const { value, onChange, type } = props;
  const { t } = useTranslation();
  const token = useAntdToken();

  // 从 value 中解构 rules，如果 value 不存在则使用空数组
  const rules = value?.rules || [];
  const validationType = value?.type || type || 'string';

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

  const validationOptions = useMemo(() => {
    return VALIDATION_OPTIONS[validationType] || VALIDATION_OPTIONS.string;
  }, [validationType]);

  const handleAddRule = (ruleType: string) => {
    const newRule: ValidationRule = {
      key: `r_${Date.now()}`,
      name: ruleType,
      args: {},
    };

    const newRules = [...rules, newRule];
    const newValue: ValidationData = {
      type: validationType,
      rules: newRules,
    };
    onChange?.(newValue);
  };

  const handleRemoveRule = (ruleIndex: number) => {
    const newRules = rules.filter((_, index) => index !== ruleIndex);
    const newValue: ValidationData = {
      type: validationType,
      rules: newRules,
    };
    onChange?.(newValue);
  };

  const handleRuleChange = (ruleIndex: number, field: string, fieldValue: any) => {
    const newRules = rules.map((rule, index) => {
      if (index === ruleIndex) {
        if (field === 'value') {
          let argKey = 'limit';
          if (rule.name === 'pattern') {
            argKey = 'regex';
          } else {
            fieldValue = Number(fieldValue);
          }

          return { ...rule, args: { ...rule.args, [argKey]: fieldValue } };
        } else if (field === 'name') {
          return { ...rule, name: fieldValue, args: {} };
        } else {
          return { ...rule, [field]: fieldValue };
        }
      }
      return rule;
    });
    const newValue: ValidationData = {
      type: validationType,
      rules: newRules,
    };
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
        {rules.map((rule, index) => {
          const needsValue = !['required', 'email', 'url'].includes(rule.name);
          const currentValue = rule.args?.limit || rule.args?.regex || '';

          return (
            <div key={rule.key} style={styles.ruleRow}>
              <Select
                value={rule.name}
                onChange={(newType) => handleRuleChange(index, 'name', newType)}
                style={styles.ruleSelect}
                options={validationOptions.map((opt) => ({
                  value: opt.key,
                  label: t(opt.label),
                }))}
                size="small"
              />

              {needsValue && (
                <Input
                  value={currentValue}
                  onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                  placeholder={t('Enter value')}
                  style={styles.ruleInput}
                  size="small"
                />
              )}

              <CloseOutlined style={styles.removeButton} onClick={() => handleRemoveRule(index)} />
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
