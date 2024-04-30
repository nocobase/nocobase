/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { collectionDataSource, defaultProps, operators } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class CollectionSelectFieldInterface extends CollectionFieldInterface {
  name = 'collection';
  type = 'string';
  group = 'advanced';
  order = 5;
  title = '{{t("Collection selector")}}';
  description =
    '{{t("Providing certain collections as options for users, typically used in polymorphic or inheritance scenarios")}}';
  sortable = true;
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'CollectionSelect',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = false;

  properties = {
    ...defaultProps,
    'uiSchema.enum': collectionDataSource,
  };

  filterable = {
    operators: operators.collection,
  };

  schemaInitialize(schema: ISchema, { block }): void {
    const props = (schema['x-component-props'] = schema['x-component-props'] || {});
    props.style = {
      ...(props.style || {}),
      width: '100%',
    };

    if (['Table', 'Kanban'].includes(block)) {
      props['ellipsis'] = true;
    }
  }
}
