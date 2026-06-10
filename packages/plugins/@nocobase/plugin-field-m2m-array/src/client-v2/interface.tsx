/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, type FieldInterfaceConfigure } from '@nocobase/client-v2';
import { ForeignKeyConfigureField } from './components/ForeignKeyConfigureField';
import { tExpr } from './locale';

export class MBMFieldInterface extends CollectionFieldInterface {
  name = 'mbm';
  type = 'object';
  group = 'relation';
  order = 6;
  title = tExpr('Many to many (array)');
  description = tExpr('Many to many (array) description');
  isAssociation = true;
  default = {
    type: 'belongsToArray',
    uiSchema: {
      'x-component': 'AssociationField',
      'x-component-props': {
        multiple: true,
      },
    },
  };
  availableTypes = ['belongsToArray'];
  validationType = 'object';
  configure: FieldInterfaceConfigure = {
    items: [
      {
        name: 'source',
        title: '{{t("Source collection")}}',
        component: 'SourceCollection',
        layout: { row: 'collections', column: 'source', span: 12 },
      },
      {
        name: 'target',
        title: '{{t("Target collection")}}',
        component: 'Select',
        required: true,
        disabled: '{{ !createOnly }}',
        layout: { row: 'collections', column: 'target', span: 12 },
      },
      {
        name: 'foreignKey',
        title: '{{t("Foreign key")}}',
        Component: ForeignKeyConfigureField,
        required: true,
        defaultValue: '{{ useNewId("f_") }}',
        description:
          "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
        disabled: '{{ !createOnly }}',
        layout: { row: 'keys', column: 'foreignKey', span: 12 },
      },
      {
        name: 'targetKey',
        title: '{{t("Target key")}}',
        component: 'TargetKey',
        required: true,
        description: "{{t('Field values must be unique.')}}",
        disabled: '{{ !createOnly }}',
        layout: { row: 'keys', column: 'targetKey', span: 12 },
      },
    ],
  };
  filterable = {
    nested: true,
    children: [],
  };
}
