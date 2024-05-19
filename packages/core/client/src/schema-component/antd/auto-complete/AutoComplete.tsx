/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps, mapReadPretty } from '@formily/react';
import { AutoComplete as AntdAutoComplete } from 'antd';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { ReadPretty } from '../input';

export const AutoComplete = withDynamicSchemaProps(
  connect(
    AntdAutoComplete,
    mapProps({
      dataSource: 'options',
    }),
    mapReadPretty(ReadPretty.Input),
  ),
);
