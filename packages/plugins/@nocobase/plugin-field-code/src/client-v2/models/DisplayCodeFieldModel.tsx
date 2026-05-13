/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '@nocobase/client-v2';
import { DisplayItemModel, largeField } from '@nocobase/flow-engine';
import CodeEditor from '../CodeEditor';
import {
  getHeightOptions,
  INDENT_UNIT_OPTIONS,
  normalizeHeight,
  normalizeIndentUnit,
  renderHeightDropdown,
  renderIndentDropdown,
} from '../codeFieldSettings';
import { tExpr } from '../locale';

@largeField()
export class DisplayCodeFieldModel extends FieldModel {
  declare props: Record<string, any>;

  render() {
    return <CodeEditor {...this.props} disabled />;
  }
}

(DisplayCodeFieldModel as any).define({
  label: tExpr('Code'),
});

(DisplayCodeFieldModel as any).registerFlow({
  key: 'displayCodeFieldSettings',
  sort: 200,
  title: tExpr('Content settings'),
  steps: {
    height: {
      title: tExpr('Content height'),
      defaultParams(ctx) {
        return {
          height: ctx.model?.props?.height || 'auto',
        };
      },
      uiMode(ctx) {
        const currentHeight = normalizeHeight(ctx.model?.props?.height);
        return {
          type: 'select',
          key: 'height',
          props: {
            options: getHeightOptions(ctx),
            dropdownRender: (menu, setOpen, handleChange) =>
              renderHeightDropdown(ctx, menu, setOpen, handleChange, currentHeight),
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          height: normalizeHeight(params.height),
        });
      },
    },
    indentUnit: {
      title: tExpr('Indent unit'),
      defaultParams(ctx) {
        return {
          indentUnit: Number(ctx.model?.props?.indentUnit || 2),
        };
      },
      uiMode(ctx) {
        const currentIndentUnit = normalizeIndentUnit(ctx.model?.props?.indentUnit);
        return {
          type: 'select',
          key: 'indentUnit',
          props: {
            options: INDENT_UNIT_OPTIONS,
            dropdownRender: (menu, setOpen, handleChange) =>
              renderIndentDropdown(ctx, menu, setOpen, handleChange, currentIndentUnit),
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          indentUnit: normalizeIndentUnit(params.indentUnit),
        });
      },
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplayCodeFieldModel', ['code'], { isDefault: true });
