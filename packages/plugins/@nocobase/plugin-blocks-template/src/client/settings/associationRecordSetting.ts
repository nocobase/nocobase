/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettingsItemType,
  useCollection,
  useCurrentPopupRecord,
  useDesignable,
  useLocalVariables,
} from '@nocobase/client';
import { useT } from '../locale';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';

export const associationRecordSettingItem: SchemaSettingsItemType = {
  name: 'template-association-record',
  type: 'select',
  useVisible() {
    const fieldSchema = useFieldSchema();
    const currentCollection = useCollection();
    const variables = useLocalVariables();
    const nRecord = variables.find((v) => v.name === '$nRecord');
    const decorator = fieldSchema['x-decorator'];
    const decoratorProps = fieldSchema['x-decorator-props'];
    const options = ['none'];
    const currentCollectionName = decoratorProps?.collection || decoratorProps?.association;
    if (decorator === 'DetailsBlockProvider' && nRecord.collectionName === currentCollectionName) {
      options.push('current');
    }
    const templateBlock = _.get(fieldSchema, 'x-template-uid');
    if (!templateBlock || !currentCollection || options.length === 1) {
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
    const { dn, refresh } = useDesignable();
    const currentCollection = useCollection();
    const currentPopupRecord = useCurrentPopupRecord();
    let currentOption = 'none';
    const options = ['none'];
    // const parentPopupRecord = useParentPopupRecord();
    const variables = useLocalVariables();
    const nRecord = variables.find((v) => v.name === '$nRecord');
    const decorator = fieldSchema['x-decorator'];
    const decoratorProps = fieldSchema['x-decorator-props'];
    const currentCollectionName = decoratorProps?.collection || decoratorProps?.association;
    if (decorator === 'DetailsBlockProvider' && nRecord.collectionName === currentCollectionName) {
      options.push('current');
      if (decoratorProps.action === 'get') {
        currentOption = 'current';
      }
    }

    return {
      title: t('Associate Record'),
      value: currentOption,
      options: options.map((v) => ({ value: v })),
      onChange: (option) => {
        let schema = {};
        if (option === 'current') {
          schema = {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': {
              action: 'get',
              collection: currentCollection.name,
              dataSource: fieldSchema['x-decorator-props'].dataSource,
            },
          };
        }

        if (option === 'none') {
          schema = {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': {
              action: 'list',
              collection: currentCollection.name,
              dataSource: fieldSchema['x-decorator-props'].dataSource,
            },
          };
        }

        field.decoratorProps.params = { ...fieldSchema['x-decorator-props'].params, page: 1 };
        dn.emit('patch', {
          schema,
        });
      },
    };
  },
};
