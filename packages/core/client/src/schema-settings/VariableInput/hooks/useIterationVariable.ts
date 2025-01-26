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
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useCollection } from '../../../data-source';
import { CollectionFieldOptions } from '../../../data-source/collection/Collection';
import { useFlag } from '../../../flag-provider';
import { useSubFormValue } from '../../../schema-component/antd/association-field/hooks';
import { useBaseVariable } from './useBaseVariable';

/**
 * @deprecated
 * 该 hook 已废弃，请使用 `useCurrentObjectVariable` 代替
 *
 * 变量：`当前对象`
 * @param param0
 * @returns
 */
export const useIterationVariable = ({
  currentCollection,
  collectionField,
  schema,
  noDisabled,
  targetFieldSchema,
}: {
  currentCollection: string;
  collectionField: CollectionFieldOptions_deprecated;
  schema?: any;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}) => {
  // const { getActiveFieldsName } = useFormActiveFields() || {};
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema: schema,
    targetFieldSchema,
    maxDepth: 4,
    name: '$iteration',
    title: t('Current object'),
    collectionName: currentCollection,
    noDisabled,
    returnFields: (fields, option) => {
      // fix https://nocobase.height.app/T-2277
      return fields;
      // const activeFieldsName = getActiveFieldsName?.('nester') || [];

      // return option.depth === 0
      //   ? fields.filter((field) => {
      //       return activeFieldsName?.includes(field.name);
      //     })
      //   : fields;
    },
  });

  return result;
};

/**
 * 变量：`当前对象`相关的 hook
 * @returns
 */
export const useCurrentObjectContext = () => {
  const { isInSubForm, isInSubTable } = useFlag() || {};
  const { formValue: currentObjectCtx, collection: collectionOfCurrentObject } = useSubFormValue();

  return {
    /** 是否显示变量 */
    shouldDisplayCurrentObject: isInSubForm || isInSubTable,
    /** 变量的值 */
    currentObjectCtx,
    /** 变量的 collection */
    collectionOfCurrentObject,
  };
};

/**
 * 变量：`当前对象`
 * @param param0
 * @returns
 */
export const useCurrentObjectVariable = ({
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
  const collection = useCollection();
  const { t } = useTranslation();
  const { shouldDisplayCurrentObject, currentObjectCtx, collectionOfCurrentObject } = useCurrentObjectContext();
  const currentObjectSettings = useBaseVariable({
    collectionField,
    uiSchema: schema,
    targetFieldSchema,
    maxDepth: 4,
    name: '$iteration',
    title: t('Current object'),
    collectionName: collectionOfCurrentObject?.name || collection?.name,
    noDisabled,
    dataSource: collection?.dataSource,
    returnFields: (fields, option) => {
      // fix https://nocobase.height.app/T-2277
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
    /** 是否显示变量 */
    shouldDisplayCurrentObject,
    /** 变量的值 */
    currentObjectCtx,
    /** 变量的配置项 */
    currentObjectSettings,
  };
};
