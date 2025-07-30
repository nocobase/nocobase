/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined, DeleteOutlined, DownOutlined, RightOutlined, UpOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { List, Input, Switch, InputNumber, Form, Button, Dropdown, Checkbox } from 'antd';
import type { MenuProps } from 'antd';
import { useAntdToken } from 'antd-style';
import React, { useMemo, useState } from 'react';
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
    { key: 'max', label: 'Max', hasValue: true, params: [{ key: 'limit', label: 'limit', inputType: 'number' }] },
    { key: 'min', label: 'Min', hasValue: true, params: [{ key: 'limit', label: 'limit', inputType: 'number' }] },
    { key: 'required', label: 'Required', hasValue: false, params: [] },
    { key: 'alphanum', label: 'Alphanum', hasValue: false, params: [] },
    {
      key: 'length',
      label: 'Length',
      hasValue: true,
      params: [{ key: 'limit', label: 'Exact Length', inputType: 'number' }],
    },
    {
      key: 'pattern',
      label: 'Pattern',
      hasValue: true,
      params: [{ key: 'regex', label: 'Regular Expression', inputType: 'text' }],
    },
    { key: 'email', label: 'Email', hasValue: false, params: [] },
    { key: 'url', label: 'URL', hasValue: false, params: [] },
  ],
  number: [
    { key: 'max', label: 'Max', hasValue: true, params: [{ key: 'limit', label: 'Max Value', inputType: 'number' }] },
    { key: 'min', label: 'Min', hasValue: true, params: [{ key: 'limit', label: 'Min Value', inputType: 'number' }] },
    { key: 'required', label: 'Required', hasValue: false, params: [] },
    { key: 'integer', label: 'Integer', hasValue: false, params: [] },
    { key: 'positive', label: 'Positive', hasValue: false, params: [] },
    { key: 'negative', label: 'Negative', hasValue: false, params: [] },
  ],
  email: [
    { key: 'required', label: 'Required', hasValue: false, params: [] },
    { key: 'max', label: 'Max', hasValue: true, params: [{ key: 'limit', label: 'Max Length', inputType: 'number' }] },
    { key: 'min', label: 'Min', hasValue: true, params: [{ key: 'limit', label: 'Min Length', inputType: 'number' }] },
  ],
  url: [
    { key: 'required', label: 'Required', hasValue: false, params: [] },
    { key: 'max', label: 'Max', hasValue: true, params: [{ key: 'limit', label: 'Max Length', inputType: 'number' }] },
    { key: 'min', label: 'Min', hasValue: true, params: [{ key: 'limit', label: 'Min Length', inputType: 'number' }] },
  ],
};

export const FieldValidation = observer((props: FieldValidationProps) => {
  const { value, onChange, type } = props;
  const { t } = useTranslation();
  const token = useAntdToken();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const validationType = value?.type || type || 'string';
  const rules = value?.rules || [];

  const validationOptions = useMemo(() => {
    return VALIDATION_OPTIONS[validationType] || VALIDATION_OPTIONS.string;
  }, [validationType]);

  const handleAddRule = (ruleType: string) => {
    const option = validationOptions.find((opt) => opt.key === ruleType);
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

    if (option?.hasValue && option.params.length > 0) {
      setExpandedKeys([...expandedKeys, newRule.key]);
    }

    onChange?.(newValue);
  };

  const handleRemoveRule = (ruleKey: string) => {
    const newRules = rules.filter((rule) => rule.key !== ruleKey);
    const newValue: ValidationData = {
      type: validationType,
      rules: newRules,
    };

    setExpandedKeys(expandedKeys.filter((key) => key !== ruleKey));

    onChange?.(newValue);
  };

  const handleRuleValueChange = (ruleKey: string, argKey: string, newValue: any) => {
    const newRules = rules.map((rule) => {
      if (rule.key === ruleKey) {
        return {
          ...rule,
          args: { ...rule.args, [argKey]: newValue },
        };
      }
      return rule;
    });

    const updatedValue: ValidationData = {
      type: validationType,
      rules: newRules,
    };
    onChange?.(updatedValue);
  };

  const handleToggleExpand = (ruleKey: string) => {
    const isExpanded = expandedKeys.includes(ruleKey);
    if (isExpanded) {
      setExpandedKeys(expandedKeys.filter((key) => key !== ruleKey));
    } else {
      setExpandedKeys([...expandedKeys, ruleKey]);
    }
  };

  const renderValidationForm = (rule: ValidationRule) => {
    const option = validationOptions.find((opt) => opt.key === rule.name);
    if (!option) return null;

    if (!option.hasValue || option.params.length === 0) {
      return (
        <div style={{ color: token.colorTextSecondary }}>{t('This validation rule has no additional parameters')}</div>
      );
    }

    return (
      <Form size="small">
        {option.params.map((param) => {
          const currentValue = rule.args?.[param.key];

          return (
            <Form.Item
              key={param.key}
              label={t(param.label)}
              style={{ marginBottom: token.marginSM, paddingLeft: 8, paddingRight: 8 }}
            >
              {param.inputType === 'boolean' ? (
                <Switch
                  checked={currentValue || false}
                  onChange={(checked) => handleRuleValueChange(rule.key, param.key, checked)}
                  checkedChildren={t('Yes')}
                  unCheckedChildren={t('No')}
                />
              ) : param.inputType === 'number' ? (
                <InputNumber
                  value={currentValue || ''}
                  onChange={(val) => handleRuleValueChange(rule.key, param.key, val)}
                  placeholder={t('Enter value')}
                  style={{ width: '100%' }}
                />
              ) : (
                <Input
                  value={currentValue || ''}
                  onChange={(e) => handleRuleValueChange(rule.key, param.key, e.target.value)}
                  placeholder={t('Enter value')}
                />
              )}
            </Form.Item>
          );
        })}
      </Form>
    );
  };

  const menuItems: MenuProps['items'] = useMemo(() => {
    const addedRuleNames = new Set(rules.map((rule) => rule.name));
    return validationOptions
      .filter((option) => !addedRuleNames.has(option.key))
      .map((option) => ({
        key: option.key,
        label: t(option.label),
      }));
  }, [validationOptions, rules, t]);

  const menu: MenuProps = {
    items: menuItems,
    onClick: ({ key }) => {
      handleAddRule(key as string);
    },
  };

  return (
    <div style={{ marginBottom: token.marginLG }}>
      {rules.length > 0 && (
        <List
          size="small"
          style={{
            backgroundColor: token.colorFillAlter,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadius,
            marginBottom: token.marginSM,
          }}
          dataSource={rules}
          renderItem={(rule) => {
            const option = validationOptions.find((opt) => opt.key === rule.name);
            const ruleLabel = option ? t(option.label) : rule.name;
            const hasParams = option?.hasValue && option.params.length > 0;
            const isExpanded = expandedKeys.includes(rule.key);

            return (
              <List.Item
                style={{
                  display: 'block',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${token.paddingXS}px ${token.paddingSM}px`,
                    cursor: hasParams ? 'pointer' : 'default',
                    backgroundColor: token.colorBgContainer,
                    borderRadius: 6,
                  }}
                  onClick={() => hasParams && handleToggleExpand(rule.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
                    <div
                      style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {hasParams && (
                        <Button
                          type="text"
                          size="small"
                          icon={isExpanded ? <DownOutlined /> : <RightOutlined />}
                          style={{
                            color: token.colorTextSecondary,
                            width: 16,
                            height: 16,
                            minWidth: 16,
                            padding: 0,
                          }}
                        />
                      )}
                    </div>
                    <span>{ruleLabel}</span>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRule(rule.key);
                    }}
                    style={{
                      color: token.colorTextSecondary,
                    }}
                  />
                </div>
                {hasParams && isExpanded && (
                  <div
                    style={{
                      padding: token.paddingSM,
                      backgroundColor: token.colorBgContainer,
                      borderTop: `1px solid ${token.colorBorder}`,
                      borderRadius: '0 0 6px 6px',
                    }}
                  >
                    {renderValidationForm(rule)}
                  </div>
                )}
              </List.Item>
            );
          }}
        />
      )}

      {menuItems.length > 0 && (
        <Dropdown menu={menu} placement="bottomLeft">
          <Button type="dashed" icon={<PlusOutlined />} size="small">
            {t('Add rule')} <DownOutlined />
          </Button>
        </Dropdown>
      )}
    </div>
  );
});

FieldValidation.displayName = 'FieldValidation';
