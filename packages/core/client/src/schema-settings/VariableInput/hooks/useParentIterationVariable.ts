/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../../data-source/collection/Collection';
import { useFlag } from '../../../flag-provider';
import { useSubFormValue } from '../../../schema-component/antd/association-field/hooks';
import { useBaseVariable } from './useBaseVariable';

export const useParentObjectContext = () => {
  const { parent } = useSubFormValue();
  const { value: parentObjectCtx, collection: collectionOfParentObject } = parent || {};
  const { isInSubForm, isInSubTable } = useFlag() || {};

  return {
    /** 是否显示变量 */
    shouldDisplayParentObject: (isInSubForm || isInSubTable) && !!collectionOfParentObject,
    /** 变量的值 */
    parentObjectCtx,
    collectionName: collectionOfParentObject?.name,
    dataSource: collectionOfParentObject?.dataSource,
  };
};

/**
 * 变量：`上级对象`
 * @param param0
 * @returns
 */
export const useParentObjectVariable = ({
  collectionField,
  schema,
  noDisabled,
  targetFieldSchema,
}: {
  collectionField?: CollectionFieldOptions;
  schema?: any;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
} = {}) => {
  // const { getActiveFieldsName } = useFormActiveFields() || {};
  const { t } = useTranslation();
  const { shouldDisplayParentObject, parentObjectCtx, collectionName, dataSource } = useParentObjectContext();
  const parentObjectSettings = useBaseVariable({
    collectionField,
    uiSchema: schema,
    targetFieldSchema,
    maxDepth: 4,
    name: '$nParentIteration',
    title: t('Parent object'),
    collectionName,
    noDisabled,
    dataSource,
    returnFields: (fields, option) => {
      return fields;
      // const activeFieldsName = getActiveFieldsName?.('nester') || [];

      // return option.depth === 0
      //   ? fields.filter((field) => {
      //       return activeFieldsName?.includes(field.name);
      //     })
      //   : fields;
    },
  });

  return {
    /** 变量的配置项 */
    parentObjectSettings,
    /** 是否显示变量 */
    shouldDisplayParentObject,
    /** 变量的值 */
    parentObjectCtx,
    collectionName,
  };
};
