/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowDownOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Button, Dropdown, Flex, Form, Space, Tag } from 'antd';
import { theme } from 'antd';
import type { DateCalculationInputType } from '../../constants';
import { dataTypeOptionMap } from '../../constants';
import {
  dateFunctions,
  DateCalculationInputField,
  DateCalculationInputTypeField,
  DateCalculationStepArguments,
  getDateCalculationDefaultParams,
  isDateCalculationFunctionKey,
  isDateCalculationInputType,
  StepOutputTag,
  useDateFunctionMenuItems,
} from '../../dateFunctions';
import { useT } from '../../locale';

function StepsEditor() {
  const t = useT();
  const { token } = theme.useToken();
  const form = Form.useFormInstance();
  const steps = Form.useWatch(['config', 'steps'], form) ?? [];
  const inputType = (Form.useWatch(['config', 'inputType'], form) ?? 'date') as DateCalculationInputType;
  const previousInputTypeRef = useRef<DateCalculationInputType>(inputType);
  const lastFunctionKey = steps[steps.length - 1]?.function;
  const lastOutputType = isDateCalculationFunctionKey(lastFunctionKey)
    ? dateFunctions[lastFunctionKey].outputType
    : null;
  const menuInputType = steps.length ? (isDateCalculationInputType(lastOutputType) ? lastOutputType : null) : inputType;
  const menuItems = useDateFunctionMenuItems(menuInputType);

  useEffect(() => {
    if (previousInputTypeRef.current !== inputType) {
      form.setFieldValue(['config', 'steps'], []);
      previousInputTypeRef.current = inputType;
    }
  }, [form, inputType]);

  const stepsEditorClassName = css`
    width: 100%;
  `;

  const stepCardClassName = css`
    position: relative;
    overflow: hidden;
    padding: 30px ${token.paddingLG}px ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillAlter};

    &:hover .workflow-date-calculation-remove-button {
      opacity: 1;
      visibility: visible;
    }
  `;

  const stepOutputClassName = css`
    margin-top: ${token.marginSM}px;
    margin-left: ${token.paddingLG}px;
    color: ${token.colorTextDescription};
  `;

  const stepTitleBarClassName = css`
    position: absolute;
    top: 0;
    left: ${token.paddingLG}px;
    height: 1.5em;
    line-height: 1.5em;
    padding-inline: 0.5em;
    font-size: ${token.fontSizeSM}px;
    border-radius: 0 0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px;
    margin-inline-end: 0;
    z-index: 1;

    &.ant-tag {
      background: #87d068;
      color: ${token.colorTextLightSolid};
      border: none;
    }
  `;

  const stepDeleteButtonClassName = css`
    position: absolute;
    top: 0;
    right: 0;
    height: 22px;
    padding: 0;
    padding-inline: ${token.paddingSM}px;
    color: ${token.colorTextSecondary};
    z-index: 1;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.2s ease,
      visibility 0.2s ease;
  `;

  const stepBodyClassName = css`
    padding-top: 0;
  `;

  const stepItemClassName = css`
    width: 100%;
  `;

  return (
    <Form.List name={['config', 'steps']}>
      {(fields, operations) => (
        <Space direction="vertical" size="middle" className={stepsEditorClassName}>
          {fields.map((field, index) => {
            const functionKey = isDateCalculationFunctionKey(steps[index]?.function)
              ? steps[index].function
              : undefined;
            const stepTitle = functionKey ? t(dateFunctions[functionKey].titleKey) : '';
            const outputType = functionKey ? dateFunctions[functionKey].outputType : undefined;
            const outputTypeOption = outputType ? dataTypeOptionMap[outputType] : undefined;

            return (
              <div key={field.key} className={stepItemClassName}>
                <div className={stepCardClassName}>
                  {stepTitle ? (
                    <Tag color="success" className={stepTitleBarClassName}>
                      {stepTitle}
                    </Tag>
                  ) : null}
                  {index === fields.length - 1 ? (
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label={t('Remove')}
                      className={`workflow-date-calculation-remove-button ${stepDeleteButtonClassName}`}
                      onClick={() => operations.remove(field.name)}
                    />
                  ) : null}
                  <div className={stepBodyClassName}>
                    <Form.Item name={[field.name, 'function']} hidden>
                      <input />
                    </Form.Item>
                    <DateCalculationStepArguments stepName={field.name} functionKey={functionKey} />
                  </div>
                </div>
                {outputTypeOption ? (
                  <Flex align="center" gap="small" className={stepOutputClassName}>
                    <ArrowDownOutlined />
                    <StepOutputTag functionKey={functionKey} />
                  </Flex>
                ) : null}
              </div>
            );
          })}
          {menuItems.length ? (
            <Dropdown
              menu={{
                items: menuItems,
                onClick({ key }) {
                  if (!isDateCalculationFunctionKey(key)) {
                    return;
                  }
                  operations.add({
                    function: key,
                    arguments: getDateCalculationDefaultParams(key),
                  });
                },
              }}
            >
              <Button type="dashed" icon={<PlusOutlined />}>
                {t('Add step')}
              </Button>
            </Dropdown>
          ) : (
            <Button disabled>{t('Result')}</Button>
          )}
        </Space>
      )}
    </Form.List>
  );
}

export function DateCalculationFieldset() {
  const t = useT();
  const form = Form.useFormInstance();

  useEffect(() => {
    if (typeof form.getFieldValue(['config', 'inputType']) === 'undefined') {
      form.setFieldValue(['config', 'inputType'], 'date');
    }
    if (typeof form.getFieldValue(['config', 'input']) === 'undefined') {
      form.setFieldValue(['config', 'input'], '{{$system.now}}');
    }
    if (typeof form.getFieldValue(['config', 'steps']) === 'undefined') {
      form.setFieldValue(['config', 'steps'], []);
    }
  }, [form]);

  return (
    <>
      <Form.Item name={['config', 'input']} label={t('Input')} rules={[{ required: true }]}>
        <DateCalculationInputField />
      </Form.Item>

      <Form.Item name={['config', 'inputType']} label={t('Input type as')}>
        <DateCalculationInputTypeField />
      </Form.Item>

      <Form.Item label={t('Calculation steps')}>
        <StepsEditor />
      </Form.Item>
    </>
  );
}

export default DateCalculationFieldset;
