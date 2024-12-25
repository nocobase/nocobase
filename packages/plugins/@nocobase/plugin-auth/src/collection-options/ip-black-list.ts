/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ipBlackListCollName } from '../constants';
const ipBlacklistCollectionOptions = {
  name: ipBlackListCollName,
  filterTargetKey: 'key',
  autoGenId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  fields: [
    {
      name: 'key',
      type: 'uid',
      primaryKey: true,
      allowNull: false,
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Key")}}',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'ipRange',
      allowNull: false,
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("IP")}}',
        required: true,
      },
    },
  ],
};
export default ipBlacklistCollectionOptions;
