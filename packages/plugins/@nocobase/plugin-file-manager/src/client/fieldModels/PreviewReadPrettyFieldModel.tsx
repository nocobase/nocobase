/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReadPrettyFieldModel } from '@nocobase/client';
import { castArray } from 'lodash';
import React from 'react';
import { reactive } from '@nocobase/flow-engine';
import { Image } from 'antd';

const Preview = ({ value = [] }) => {
  return (
    <>
      {Array.isArray(value) &&
        value.map((v, index) => {
          const src = typeof v === 'string' ? v : v?.preview;
          return src && <Image key={index} src={src} width={24} height={24} />;
        })}
    </>
  );
};
export class PreviewReadPrettyFieldModel extends ReadPrettyFieldModel {
  static supportedFieldInterfaces = ['url', 'attachment'];

  @reactive
  public render() {
    const value = this.getValue();
    return <Preview value={castArray(value)} />;
  }
}
