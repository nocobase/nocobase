/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { uid } from '@formily/shared';
import { Select, Space } from 'antd';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { ValueDynamicComponent } from './ValueDynamicComponent';
import { RemoveActionContext } from './context';
import { ActionType } from './type';
import { useValues } from './useValues';

const colorSchema = {
  type: 'string',
  'x-decorator': 'FormItem',
  'x-component': 'ColorPicker',
  'x-component-props': {
    defaultValue: '',
  },
};
const textAlignSchema = {
  type: 'string',
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  'x-component-props': {
    defaultValue: '',
  },
  enum: [
    {
      label: 'left',
      value: 'left',
    },
    {
      label: 'right',
      value: 'right',
    },
    {
      label: 'center',
      value: 'center',
    },
  ],
};

const fontSizeSchema = {
  type: 'number',
  'x-decorator': 'FormItem',
  'x-component': 'InputNumber',
  'x-component-props': {
    precision: 0,
  },
  minimum: 0,
  maximum: 30,
};

const fontWeightSchema = {
  type: 'number',
  'x-decorator': 'FormItem',
  'x-component': 'InputNumber',
  'x-component-props': {
    precision: 0,
  },
  minimum: 100,
  maximum: 900,
};

const fontStyleSchema = {
  type: 'string',
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  'x-component-props': {
    defaultValue: '',
  },
  enum: [
    {
      label: 'normal',
      value: 'normal',
    },
    {
      label: 'italic',
      value: 'italic',
    },
  ],
};

const schemas = new Map();
schemas.set(ActionType.Color, colorSchema);
schemas.set(ActionType.BackgroundColor, colorSchema);
schemas.set(ActionType.TextAlign, textAlignSchema);
schemas.set(ActionType.FontSize, fontSizeSchema);
schemas.set(ActionType.FontWeight, fontWeightSchema);
schemas.set(ActionType.FontStyle, fontStyleSchema);

export const FieldStyleLinkageRuleAction = observer(
  (props: any) => {
    const { options, collectionName } = props;
    const { t } = useTranslation();
    const compile = useCompile();
    const remove = useContext(RemoveActionContext);
    const { operator, setOperator, value: fieldValue, setValue } = useValues(options);
    const operators = useMemo(
      () =>
        compile([
          { label: t('Color'), value: ActionType.Color, schema: {} },
          { label: t('Background Color'), value: ActionType.BackgroundColor, schema: {} },
          { label: t('Text Align'), value: ActionType.TextAlign, schema: {} },
          { label: t('Font Size (px)'), value: ActionType.FontSize, schema: {} },
          { label: t('Font Weight'), value: ActionType.FontWeight, schema: {} },
          { label: t('Font Style'), value: ActionType.FontStyle, schema: {} },
        ]),
      [compile, t],
    );

    const onChange = useCallback(
      (value) => {
        setOperator(value);
      },
      [setOperator],
    );

    const closeStyle = useMemo(() => ({ color: '#bfbfbf' }), []);
    return (
      <div style={{ marginBottom: 8 }}>
        <Space>
          <Select
            data-testid="select-linkage-properties"
            popupMatchSelectWidth={false}
            value={operator}
            options={operators}
            onChange={onChange}
            placeholder={t('action')}
          />
          {operator && (
            <ValueDynamicComponent
              fieldValue={fieldValue}
              schema={schemas.get(operator)}
              setValue={setValue}
              collectionName={collectionName}
              inputModes={['constant']}
            />
          )}
          {!props.disabled && (
            <a role="button" aria-label="icon-close">
              <CloseCircleOutlined onClick={remove} style={closeStyle} />
            </a>
          )}
        </Space>
      </div>
    );
  },
  { displayName: 'FormStyleLinkageRuleAction' },
);
