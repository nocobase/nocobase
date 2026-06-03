/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';
import { defaultProps } from './properties';

export class CreatedByFieldInterface extends CollectionFieldInterface {
  name = 'createdBy';
  type = 'object';
  group = 'systemInfo';
  order = 3;
  title = '{{t("Created by")}}';
  isAssociation = true;
  default = {
    type: 'belongsTo',
    target: 'users',
    foreignKey: 'createdById',
    uiSchema: {
      type: 'object',
      title: '{{t("Created by")}}',
      'x-component': 'AssociationField',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'nickname',
        },
      },
      'x-read-pretty': true,
    },
  };
  availableTypes = ['belongsTo'];
  properties = {
    ...defaultProps,
  };
  filterable = {
    nested: true,
    children: [],
    // children: [
    //   {
    //     name: 'id',
    //     title: '{{t("ID")}}',
    //     operators: operators.id,
    //     schema: {
    //       title: '{{t("ID")}}',
    //       type: 'number',
    //       'x-component': 'InputNumber',
    //     },
    //   },
    //   {
    //     name: 'nickname',
    //     title: '{{t("Nickname")}}',
    //     operators: operators.string,
    //     schema: {
    //       title: '{{t("Nickname")}}',
    //       type: 'string',
    //       'x-component': 'Input',
    //     },
    //   },
    // ],
  };

  description = '{{t("Store the creation user of each record")}}';
}
