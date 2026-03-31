/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '@nocobase/client';
import { DisplayItemModel, largeField, tExpr } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../common/constants';
import CodeEditor from '../CodeEditor';
import {
  getHeightOptions,
  INDENT_UNIT_OPTIONS,
  normalizeHeight,
  normalizeIndentUnit,
  renderHeightDropdown,
  renderIndentDropdown,
} from './settings';

@largeField()
export class DisplayCodeFieldModel extends FieldModel {
  render() {
    return <CodeEditor {...this.props} disabled />;
  }
}

DisplayCodeFieldModel.registerFlow({
  key: 'displayCodeFieldSettings',
  sort: 200,
  title: tExpr('Content settings', { ns: NAMESPACE }),
  steps: {
    height: {
      title: tExpr('Content height', { ns: NAMESPACE }),
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
      title: tExpr('Indent unit', { ns: NAMESPACE }),
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
