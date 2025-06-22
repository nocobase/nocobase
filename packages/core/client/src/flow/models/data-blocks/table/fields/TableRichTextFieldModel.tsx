/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { TableFieldModel } from './TableFieldModel';

const lineHeight142 = { lineHeight: '1.42' };
export class TableRichTextFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = ['richText'];

  public render() {
    const value = this.getValue();
    const html = (
      <div
        style={lineHeight142}
        dangerouslySetInnerHTML={{
          __html: value,
        }}
      />
    );

    return <div>{html}</div>;
  }
}
