/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItemType, useCollection, useDesignable } from '@nocobase/client';
import { useT } from '../locale';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { AssociationRecordSetting } from '../components/AssociationRecordSetting';

export const associationRecordSettingItem: SchemaSettingsItemType = {
  name: 'template-association-record',
  // type: 'actionModal',
  type: 'select',
  // Component: AssociationRecordSetting,
  useVisible() {
    const fieldSchema = useFieldSchema();
    const templateBlock = _.get(fieldSchema, 'x-template-uid');
    if (!templateBlock) {
      return false;
    }
    if (_.get(fieldSchema, 'x-decorator-props.collection') || _.get(fieldSchema, 'x-decorator-props.association')) {
      return true;
    }
    return false;
  },
  useComponentProps() {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { dn } = useDesignable();
    const currentCollection = useCollection();

    return {
      title: t('Associate Record'),
      value: 'none',
      options: ['none', 'current', 'association'].map((v) => ({ value: v })),
      onChange: (option) => {
        // _.set(fieldSchema, 'x-decorator-props.params.pageSize', pageSize);
        field.decoratorProps.params = { ...fieldSchema['x-decorator-props'].params, page: 1 };
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
      },
    };
  },
  // useComponentProps() {
  //   const { deepMerge } = useDesignable();
  //   const t = useT();

  //   return {
  //     title: t('Associate Record'),
  //   };
  // },
};
