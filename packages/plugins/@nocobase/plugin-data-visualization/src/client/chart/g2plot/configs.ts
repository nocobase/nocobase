/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import config, { FieldConfigProps } from '../configs';
const { booleanField } = config;

export default {
  isStack: (props: FieldConfigProps) => booleanField({ name: 'isStack', title: 'isStack', ...props }),
  smooth: (props: FieldConfigProps) => booleanField({ name: 'smooth', title: 'smooth', ...props }),
  isPercent: (props: FieldConfigProps) => booleanField({ name: 'isPercent', title: 'isPercent', ...props }),
  isGroup: (props: FieldConfigProps) => booleanField({ name: 'isGroup', title: 'isGroup', ...props }),
};
