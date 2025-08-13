/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined, DeleteOutlined, DownOutlined, RightOutlined, UpOutlined } from '@ant-design/icons';
import { observer, useField } from '@formily/react';
import { List, Input, Switch, InputNumber, Form, Button, Dropdown, Checkbox, Radio, Select, DatePicker } from 'antd';
import type { MenuProps } from 'antd';
import { useAntdToken } from 'antd-style';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FIELDS_VALIDATION_OPTIONS, REQUIRED_RULE_KEY } from '../../constants';
import { css } from '@nocobase/client';
import dayjs from 'dayjs';

interface ValidationRule {
  key: string;
  name: string;
  args?: {
    [key: string]: any;
  };
  paramsType?: string;
}

interface ValidationData {
  type: string;
  rules: ValidationRule[];
}

interface FieldValidationProps {
  value?: ValidationData;
  onChange?: (value: ValidationData) => void;
  type?: string;
  availableValidationOptions?: string[];
  excludeValidationOptions?: string[];
}

export const FieldValidation = observer((props: FieldValidationProps) => {
  const { value, onChange, type, availableValidationOptions, excludeValidationOptions } = props;
  const { t } = useTranslation();
  const token = useAntdToken();
  const noCascadeCls = css`
    .ant-form-item:not(.ant-form-item-has-error) .ant-input,
    .ant-form-item:not(.ant-form-item-has-error) .ant-input-number,
    .ant-form-item:not(.ant-form-item-has-error) .ant-input-number .ant-input-number-input,
    .ant-form-item:not(.ant-form-item-has-error) .ant-select .ant-select-selector,
    .ant-form-item:not(.ant-form-item-has-error) .ant-picker {
      border-color: ${token.colorBorder} !important;
      box-shadow: none !important;
    }
  `;
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const formilyField: any = useField?.() as any;

  const validationType = value?.type || type;
  const rules = value?.rules || [];

  const isValueEmpty = useCallback((componentType: string | undefined, val: any) => {
    switch (componentType) {
      case 'checkbox':
        return val !== true;
      case 'multipleSelect':
        return !Array.isArray(val) || val.length === 0;
      case 'inputNumber':
        return val === undefined || val === null || val === '' || Number.isNaN(val as number);
      case 'datePicker':
        return !val;
      default:
        return val === undefined || val === null || val === '';
    }
  }, []);

  const validationOptions = useMemo(() => {
    const allOptions = FIELDS_VALIDATION_OPTIONS[validationType] || [];

    let filteredOptions = allOptions;
    if (excludeValidationOptions && excludeValidationOptions.length > 0) {
      filteredOptions = allOptions.filter((option) => !excludeValidationOptions.includes(option.key));
    }

    if (availableValidationOptions && availableValidationOptions.filter((x) => x !== REQUIRED_RULE_KEY).length > 0) {
      const intersection = availableValidationOptions
        .map((key) => filteredOptions.find((x) => x.key === key))
        .filter(Boolean);
      return intersection.length > 0 ? intersection : filteredOptions;
    }

    return filteredOptions;
  }, [validationType, availableValidationOptions, excludeValidationOptions]);

  useEffect(() => {
    if (!formilyField) return;
    let hasError = false;
    const invalidRuleKeys: string[] = [];
    try {
      rules.forEach((rule) => {
        const opt = validationOptions.find((o) => o.key === rule.name);
        if (!opt || !opt.params) return;
        let ruleInvalid = false;
        opt.params.forEach((param) => {
          if (!param.required) return;
          const currentValue = (rule.args?.[param.key] ?? param.defaultValue) as any;
          if (isValueEmpty(param.componentType as any, currentValue)) {
            hasError = true;
            ruleInvalid = true;
          }
        });
        if (ruleInvalid) invalidRuleKeys.push(rule.key);
      });
    } catch (err) {
      // Mark as error on unexpected exceptions to avoid empty catch block and surface validation issues
      hasError = true;
    }

    if (invalidRuleKeys.length) {
      setExpandedKeys((prev) => Array.from(new Set([...(prev || []), ...invalidRuleKeys])));
    }

    if (hasError) {
      formilyField.setFeedback?.({
        type: 'error',
        code: 'ValidateError',
        messages: [' '],
      });
    } else {
      formilyField.setFeedback?.({});
    }
  }, [formilyField, rules, validationOptions, isValueEmpty, t]);

  const handleAddRule = (ruleType: string) => {
    const option = validationOptions.find((opt) => opt.key === ruleType);
    const newRule: ValidationRule = {
      key: `r_${Date.now()}`,
      name: ruleType,
      args: {},
    };

    if (option?.params) {
      option.params.forEach((param) => {
        if (param.defaultValue !== undefined) {
          newRule.args![param.key] = param.defaultValue;
        }
      });
    }

    const newValue: ValidationData = {
      type: validationType,
      rules: [...rules, newRule],
    };

    setExpandedKeys(expandedKeys.filter((key) => key !== ruleType));

    onChange?.(newValue);
  };

  const handleRemoveRule = (ruleKey: string) => {
    const newRules = rules.filter((rule) => rule.key !== ruleKey);
    const newValue: ValidationData = {
      type: validationType,
      rules: newRules,
    };

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
          const currentValue = rule.args?.[param.key] ?? param.defaultValue;
          const isInvalid = !!param.required && isValueEmpty(param.componentType as any, currentValue);

          return (
            <Form.Item
              key={param.key}
              label={param.componentType === 'checkbox' ? null : t(param.label)}
              valuePropName={param.componentType === 'checkbox' ? 'checked' : 'value'}
              style={{ marginBottom: token.marginSM, paddingLeft: 8, paddingRight: 8 }}
              required={!!param.required}
              validateStatus={isInvalid ? 'error' : undefined}
              help={isInvalid ? t('This field is required') : undefined}
            >
              {param.componentType === 'checkbox' ? (
                <Checkbox
                  checked={currentValue || false}
                  onChange={(e) => handleRuleValueChange(rule.key, param.key, e.target.checked)}
                >
                  {t(param.label)}
                </Checkbox>
              ) : param.componentType === 'radio' ? (
                <div>
                  <Radio.Group
                    value={currentValue}
                    onChange={(e) => handleRuleValueChange(rule.key, param.key, e.target.value)}
                  >
                    {param.options?.map((option) => (
                      <Radio key={option.value} value={option.value}>
                        {t(option.label)}
                      </Radio>
                    ))}
                  </Radio.Group>
                  {param.options?.map((option) => {
                    if (option.value === currentValue && option.componentType) {
                      return (
                        <div key={`${option.value}-component`} style={{ marginTop: token.marginXS }}>
                          {option.componentType === 'text' ? (
                            <Input
                              value={rule.args?.[`${param.key}_${option.value}`] || ''}
                              onChange={(e) =>
                                handleRuleValueChange(rule.key, `${param.key}_${option.value}`, e.target.value)
                              }
                              style={{ width: '100%' }}
                            />
                          ) : option.componentType === 'inputNumber' ? (
                            <InputNumber
                              value={rule.args?.[`${param.key}_${option.value}`] || ''}
                              onChange={(val) => handleRuleValueChange(rule.key, `${param.key}_${option.value}`, val)}
                              style={{ width: '100%' }}
                            />
                          ) : option.componentType === 'checkbox' ? (
                            <Checkbox
                              checked={rule.args?.[`${param.key}_${option.value}`] || false}
                              onChange={(e) =>
                                handleRuleValueChange(rule.key, `${param.key}_${option.value}`, e.target.checked)
                              }
                            >
                              {t(option.label)}
                            </Checkbox>
                          ) : option.componentType === 'datePicker' ? (
                            <DatePicker
                              value={
                                rule.args?.[`${param.key}_${option.value}`]
                                  ? dayjs(rule.args[`${param.key}_${option.value}`])
                                  : null
                              }
                              onChange={(date) =>
                                handleRuleValueChange(rule.key, `${param.key}_${option.value}`, date?.toISOString())
                              }
                              placeholder={t('Select date')}
                              style={{ width: '100%' }}
                            />
                          ) : null}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : param.componentType === 'singleSelect' ? (
                <div>
                  <Select
                    value={currentValue}
                    onChange={(value) => handleRuleValueChange(rule.key, param.key, value)}
                    placeholder={t('Please select')}
                    style={{ width: '100%', height: '100%' }}
                    allowClear
                  >
                    {param.options?.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {t(option.label)}
                      </Select.Option>
                    ))}
                  </Select>
                  {param.options?.map((option) => {
                    if (option.value === currentValue && option.componentType) {
                      return <></>;
                    }
                    return null;
                  })}
                </div>
              ) : param.componentType === 'multipleSelect' ? (
                <Select
                  mode="multiple"
                  value={currentValue}
                  onChange={(value) => handleRuleValueChange(rule.key, param.key, value)}
                  placeholder={t('Please select')}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {param.options?.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {t(option.label)}
                    </Select.Option>
                  ))}
                </Select>
              ) : param.componentType === 'inputNumber' ? (
                <InputNumber
                  value={currentValue !== undefined ? currentValue : ''}
                  onChange={(val) => handleRuleValueChange(rule.key, param.key, val)}
                  placeholder={t('Enter value')}
                  style={{ width: '100%' }}
                />
              ) : param.componentType === 'datePicker' ? (
                <DatePicker
                  value={currentValue ? dayjs(currentValue) : null}
                  onChange={(date) => handleRuleValueChange(rule.key, param.key, date?.toISOString())}
                  placeholder={t('Select date')}
                  style={{ width: '100%' }}
                />
              ) : (
                <Input
                  value={currentValue !== undefined ? currentValue : ''}
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
    <div className={noCascadeCls} style={{ marginBottom: token.marginLG }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {menuItems.length > 0 && validationOptions.length > 0 && (
            <Dropdown menu={menu} placement="bottomLeft">
              <Button type="dashed" icon={<PlusOutlined />} size="small">
                {t('Add rule')} <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </div>
        <span>
          <span
            className={css`
              color: ${token.colorTextSecondary};
              &:after {
                content: ':';
              }
              & + a {
                margin-left: 0.25em;
              }
            `}
          >
            {t('References')}
          </span>
          <a href="https://joi.dev/api/" target="_blank" rel="noreferrer">
            {t('Joi API')}
          </a>
        </span>
      </div>
    </div>
  );
});

FieldValidation.displayName = 'FieldValidation';
