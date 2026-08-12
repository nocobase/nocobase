/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowModel } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Button, Result } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockItemCard } from '../BlockItemCard';
import type { BlockModel } from '../../models/base/BlockModel';

function getResourceSettingsInitParams(model: any) {
  if (typeof model?.getResourceSettingsInitParams === 'function') {
    return model.getResourceSettingsInitParams();
  }
  if (typeof model?.getStepParams === 'function') {
    return model.getStepParams('resourceSettings', 'init');
  }
  return undefined;
}

function getBlockResourceInfo(model: any, t: (key: string) => string) {
  const blockModel = model?.context?.blockModel || model;
  const params = getResourceSettingsInitParams(blockModel) || {};
  const collection = blockModel?.context?.collection || blockModel?.collection || model?.context?.collection;
  const dataSource =
    collection?.dataSource || blockModel?.context?.dataSource || blockModel?.dataSource || model?.dataSource;
  const dataSourceKey = dataSource?.key || collection?.dataSourceKey || params.dataSourceKey;
  const collectionName =
    collection?.title ||
    collection?.name ||
    collection?.tableName ||
    model?.resource?.resourceName ||
    model?.resource?.getResourceName?.() ||
    params.associationName ||
    params.collectionName;
  const dataSourceName = dataSource ? t(dataSource.displayName || dataSource.key) : dataSourceKey;
  const collectionLabel = collectionName ? `${t(collectionName) || collectionName}` : '';
  const dataSourceLabel = dataSourceName ? `${t(dataSourceName)} > ` : '';
  const isDataSourceLoadFailed = ['loading-failed', 'reloading-failed'].includes(dataSource?.status);

  return {
    dataSourceName,
    nameValue: `${dataSourceLabel}${collectionLabel}`,
    isDataSourceLoadFailed,
    isDataSourceUnavailable: Boolean(dataSourceKey && (!dataSource || isDataSourceLoadFailed)),
  };
}

function getTemporarilyUnavailableMessage(t: (key: string, options?: Record<string, string>) => string, name?: string) {
  return name
    ? t('The data source "{{name}}" is temporarily unavailable. Please try again later or contact an administrator.', {
        name,
      })
    : t('The data source is temporarily unavailable. Please try again later or contact an administrator.');
}

function DataSourceUnavailablePlaceholder({
  dataSourceName,
  isLoadFailed,
}: {
  dataSourceName?: string;
  isLoadFailed?: boolean;
}) {
  const { t } = useTranslation();
  const subTitle = isLoadFailed
    ? getTemporarilyUnavailableMessage(t, dataSourceName)
    : dataSourceName
      ? t(
          'The data source "{{name}}" used by this block is disabled or unavailable. Enable the data source to display this block.',
          { name: dataSourceName },
        )
      : t(
          'The data source used by this block is disabled or unavailable. Enable the data source to display this block.',
        );

  return (
    <BlockItemCard role="alert" aria-live="polite">
      <Result status={isLoadFailed ? 'warning' : '403'} subTitle={subTitle}></Result>
    </BlockItemCard>
  );
}

export const BlockPlaceholder = () => {
  const { t } = useTranslation();
  const model: BlockModel = useFlowModel();
  const { dataSourceName, isDataSourceLoadFailed, isDataSourceUnavailable, nameValue } = useMemo(() => {
    return getBlockResourceInfo(model, t);
  }, [model, t]);

  const { actionName } = model.forbidden || {};
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for collection "{{name}}"`,
      {
        name: nameValue,
        actionName: t(_.capitalize(actionName)),
      },
    ).replaceAll('&gt;', '>');
  }, [actionName, nameValue, t]);

  if (isDataSourceUnavailable) {
    return <DataSourceUnavailablePlaceholder dataSourceName={dataSourceName} isLoadFailed={isDataSourceLoadFailed} />;
  }

  return (
    <BlockItemCard>
      <Result status="403" subTitle={messageValue}></Result>
    </BlockItemCard>
  );
};

export function BlockDeletePlaceholder() {
  const { t } = useTranslation();
  const model: BlockModel = useFlowModel();
  const { dataSourceName, isDataSourceLoadFailed, isDataSourceUnavailable, nameValue } = useMemo(() => {
    return getBlockResourceInfo(model, t);
  }, [model, t]);

  const messageValue = useMemo(() => {
    return t(`The {{type}} "{{name}}" may have been deleted. Please remove this {{blockType}}.`, {
      type: t('Collection'),
      name: nameValue,
      blockType: t('Block'),
    }).replaceAll('&gt;', '>');
  }, [nameValue, t]);

  if (isDataSourceUnavailable) {
    return <DataSourceUnavailablePlaceholder dataSourceName={dataSourceName} isLoadFailed={isDataSourceLoadFailed} />;
  }

  return (
    <BlockItemCard>
      <Result status="404" subTitle={messageValue}></Result>
    </BlockItemCard>
  );
}

type RefreshableBlockModel = BlockModel & {
  refresh?: () => Promise<unknown> | unknown;
};

export function BlockResourceErrorPlaceholder() {
  const { t } = useTranslation();
  const model = useFlowModel() as RefreshableBlockModel;
  const { dataSourceName } = useMemo(() => getBlockResourceInfo(model, t), [model, t]);
  const handleRetry = useMemoizedFn(async () => {
    try {
      await model.refresh?.();
    } catch {
      // The resource retains the latest error and keeps this placeholder visible.
    }
  });

  return (
    <BlockItemCard ref={model.context.ref} {...model.decoratorProps} role="alert" aria-live="polite">
      <Result
        status="warning"
        title={t('Data loading failed')}
        subTitle={getTemporarilyUnavailableMessage(t, dataSourceName)}
        extra={
          <Button type="primary" onClick={handleRetry}>
            {t('Try again')}
          </Button>
        }
      />
    </BlockItemCard>
  );
}
