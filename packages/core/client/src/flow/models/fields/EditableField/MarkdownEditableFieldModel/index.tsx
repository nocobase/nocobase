/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from '@formily/antd-v5';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import { MarkdownReadPretty } from '../../../../internal/components/MarkdownReadPretty';
import { FormFieldModel } from '../FormFieldModel';

const Markdown: any = connect(
  Input.TextArea,
  mapProps((props: any, field) => {
    return {
      ...props,
    };
  }),
  mapReadPretty((props) => <MarkdownReadPretty {...props} />),
);
export class MarkdownEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['markdown'];

  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      autoSize: {
        maxRows: 10,
        minRows: 3,
      },
    });
  }
  get component() {
    return [Markdown, {}];
  }
}
