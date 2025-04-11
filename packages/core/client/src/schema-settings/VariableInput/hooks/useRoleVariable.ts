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
import { useAPIClient } from '../../../api-client';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { CollectionFieldOptions } from '../../../data-source/collection/Collection';
import { useBaseVariable } from './useBaseVariable';
import { string } from '../../../collection-manager/interfaces/properties/operators';
import { useCurrentUserContext } from '../../../user/CurrentUserProvider';
import { useCompile } from '../../../schema-component';

/**
 * @deprecated
 * 该 hook 已废弃，请使用 `useCurrentRoleVariable` 代替
 *
 * 变量：`当前角色`
 * @param param0
 * @returns
 */
export const useRoleVariable = ({
  collectionField,
  uiSchema,
  noDisabled,
  targetFieldSchema,
  maxDepth = 0,
}: {
  collectionField: CollectionFieldOptions_deprecated;
  uiSchema: any;
  maxDepth?: number;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema,
    maxDepth,
    name: '$nRole',
    title: t('Current role'),
    collectionName: 'roles',
    noDisabled,
    targetFieldSchema,
    noChildren: true,
    operators: string,
  });

  return result;
};

/**
 * 变量：`当前角色`
 * @param param0
 * @returns
 */
export const useCurrentRoleVariable = ({
  collectionField,
  uiSchema,
  noDisabled,
  targetFieldSchema,
  maxDepth = 0,
}: {
  collectionField?: CollectionFieldOptions;
  uiSchema?: any;
  maxDepth?: number;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
} = {}) => {
  const { t } = useTranslation();
  const apiClient = useAPIClient();
  const compile = useCompile();
  const { data } = useCurrentUserContext() || {};
  const roles = (data?.data?.roles || []).map(({ name, title }) => ({ name, title: compile(title) }));
  const currentRoleSettings = useBaseVariable({
    collectionField,
    uiSchema,
    maxDepth,
    name: '$nRole',
    title: t('Current role'),
    collectionName: 'roles',
    noDisabled,
    targetFieldSchema,
    noChildren: true,
    operators: string,
  });

  return {
    /** 变量配置项 */
    currentRoleSettings,
    /** 变量的值 */
    currentRoleCtx: apiClient.auth?.role === '__union__' ? roles.map((v) => v.name) : apiClient.auth?.role,
  };
};
