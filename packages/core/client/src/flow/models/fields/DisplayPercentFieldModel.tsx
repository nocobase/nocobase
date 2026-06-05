/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import * as math from 'mathjs';
import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import { isNum } from '@formily/shared';
import { ClickableFieldModel } from './ClickableFieldModel';
import { UnitConversion, getDisplayNumber } from './DisplayNumberFieldModel';

export class DisplayPercentFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    const { addonBefore = '', addonAfter = '%', numberStep } = this.props;
    const targetValue = math.round(value * 100, 9);
    if (value === null || value === undefined) {
      return;
    }
    const result = getDisplayNumber({ ...this.props, value: targetValue, numberStep: numberStep });
    if (!result) {
      return null;
    }
    return (
      <div>
        {addonBefore}
        <span dangerouslySetInnerHTML={{ __html: result }} />
        {addonAfter}
      </div>
    );
  }
}

DisplayPercentFieldModel.registerFlow({
  key: 'numberSettings',
  sort: 500,
  title: tExpr('Number settings'),
  steps: {
    format: {
      title: tExpr('Number format'),
      uiSchema: (ctx) => {
        return {
          formatStyle: {
            type: 'string',
            enum: [
              {
                value: 'normal',
                label: tExpr('Normal'),
              },
              {
                value: 'scientifix',
                label: tExpr('Scientifix notation'),
              },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            title: "{{t('Style')}}",
          },
          unitConversion: {
            type: 'number',
            'x-decorator': 'FormItem',
            'x-component': 'NumberPicker',
            title: "{{t('Unit conversion')}}",
            'x-component-props': {
              style: { width: '100%' },
              addonBefore: <UnitConversion />,
            },
          },
          separator: {
            type: 'string',
            enum: [
              {
                value: '0,0.00',
                label: '100,000.00',
              },
              {
                value: '0.0,00',
                label: '100.000,00',
              },
              {
                value: '0 0,00',
                label: '100 000.00',
              },
              {
                value: '0.00',
                label: '100000.00',
              },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            title: "{{t('Separator')}}",
          },
          numberStep: {
            type: 'string',
            title: '{{t("Precision")}}',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              { value: '1', label: '1' },
              { value: '0.1', label: '1.0' },
              { value: '0.01', label: '1.00' },
              { value: '0.001', label: '1.000' },
              { value: '0.0001', label: '1.0000' },
              { value: '0.00001', label: '1.00000' },
              { value: '0.000001', label: '1.000000' },
              { value: '0.0000001', label: '1.0000000' },
              { value: '0.00000001', label: '1.00000000' },
            ],
          },
          addonBefore: {
            type: 'string',
            title: '{{t("Prefix")}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          addonAfter: {
            type: 'string',
            title: '{{t("Suffix")}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-disabled': true,
          },
        };
      },
      defaultParams: (ctx) => {
        const { formatStyle, unitConversion, unitConversionType, separator, step, addonBefore, addonAfter } =
          ctx.collectionField.getComponentProps();
        return {
          formatStyle: formatStyle || 'normal',
          unitConversion,
          unitConversionType,
          separator: separator || '0,0.00',
          numberStep: step || '1',
          addonBefore,
          addonAfter: addonAfter || '%',
        };
      },
      handler(ctx, params) {
        const { formatStyle, unitConversion, unitConversionType, separator, numberStep, addonBefore, addonAfter } =
          params;
        ctx.model.setProps({
          formatStyle: formatStyle,
          unitConversion,
          unitConversionType,
          separator: separator,
          numberStep,
          addonBefore,
          addonAfter,
        });
      },
    },
  },
});

DisplayPercentFieldModel.define({
  label: tExpr('Percent'),
});

DisplayItemModel.bindModelToInterface('DisplayPercentFieldModel', ['percent'], {
  isDefault: true,
});
