/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { useBlockContext } from '../../../block-provider';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useCollection, useDataSource } from '../../../data-source';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionName?: string;
  collectionField?: CollectionFieldOptions_deprecated;
  schema?: any;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
  form?: Form;
}

/**
 * @deprecated
 * 该 hook 已废弃，请使用 `useCurrentFormVariable` 代替
 *
 * 变量：`当前表单`
 * @param param0
 * @returns
 */
export const useFormVariable = ({ collectionName, collectionField, schema, noDisabled, targetFieldSchema }: Props) => {
  // const { getActiveFieldsName } = useFormActiveFields() || {};
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema: schema,
    targetFieldSchema,
    maxDepth: 4,
    name: '$nForm',
    title: t('Current form'),
    collectionName: collectionName,
    noDisabled,
    returnFields: (fields, option) => {
      // fix https://nocobase.height.app/T-2277
      return fields;
      // const activeFieldsName = getActiveFieldsName?.('form') || [];

      // return option.depth === 0
      //   ? fields.filter((field) => {
      //       return activeFieldsName.includes(field.name);
      //     })
      //   : fields;
    },
  });

  return result;
};

/**
 * 变量：`当前表单` 相关的 hook
 * @param param0
 * @returns
 */
export const useCurrentFormContext = ({ form: _form }: Pick<Props, 'form'> = {}) => {
  const { form } = useFormBlockContext();
  const { isVariableParsedInOtherContext } = useFlag();
  const { name } = useBlockContext?.() || {};
  const formInstance = _form || form;
  return {
    /** 变量值 */
    currentFormCtx: formInstance?.values,
    /** 用来判断是否可以显示`当前表单`变量 */
    shouldDisplayCurrentForm:
      ['form', 'filter-form'].includes(name) &&
      formInstance &&
      !formInstance.readPretty &&
      !isVariableParsedInOtherContext,
  };
};

/**
 * 变量：`当前表单`
 * @param param0
 * @returns
 */
export const useCurrentFormVariable = ({
  collectionField,
  schema,
  noDisabled,
  targetFieldSchema,
  form: _form,
}: Props = {}) => {
  const { currentFormCtx, shouldDisplayCurrentForm } = useCurrentFormContext({ form: _form });
  const { t } = useTranslation();
  const { collectionName } = useFormBlockContext();
  const collection = useCollection();
  const dataSource = useDataSource();
  const currentFormSettings = useBaseVariable({
    collectionField,
    uiSchema: schema,
    targetFieldSchema,
    maxDepth: 4,
    name: '$nForm',
    title: t('Current form'),
    collectionName: collectionName || collection?.name,
    noDisabled,
    dataSource: dataSource?.key,
    returnFields: (fields, option) => {
      // fix https://nocobase.height.app/T-2277
      return fields;
      // const activeFieldsName = getActiveFieldsName?.('form') || [];

      // return option.depth === 0
      //   ? fields.filter((field) => {
      //       return activeFieldsName.includes(field.name);
      //     })
      //   : fields;
    },
  });

  return {
    /** 变量配置 */
    currentFormSettings,
    /** 变量值 */
    currentFormCtx,
    /** 用来判断是否可以显示`当前表单`变量 */
    shouldDisplayCurrentForm,
  };
};
