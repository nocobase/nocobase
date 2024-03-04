import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { CollectionFieldOptions } from '../../../data-source/collection/Collection';
import { useBaseVariable } from './useBaseVariable';

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
  });

  return {
    /** 变量配置项 */
    currentRoleSettings,
    /** 变量的值 */
    currentRoleCtx: apiClient.auth?.role,
  };
};
