/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowModel } from '@nocobase/flow-engine';
import { Result } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockItemCard } from '../BlockItemCard';
import { BlockModel } from '../../models/base/BlockModel';

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

  return {
    dataSourceName,
    nameValue: `${dataSourceLabel}${collectionLabel}`,
    isDataSourceUnavailable: Boolean(dataSourceKey && !dataSource),
  };
}

function DataSourceUnavailablePlaceholder({ dataSourceName }: { dataSourceName?: string }) {
  const { t } = useTranslation();
  const subTitle = dataSourceName
    ? t(
        'The data source "{{name}}" used by this block is disabled or unavailable. Enable the data source to display this block.',
        { name: dataSourceName },
      )
    : t('The data source used by this block is disabled or unavailable. Enable the data source to display this block.');

  return (
    <BlockItemCard>
      <Result status="403" subTitle={subTitle}></Result>
    </BlockItemCard>
  );
}

export const BlockPlaceholder = () => {
  const { t } = useTranslation();
  const model: BlockModel = useFlowModel();
  const { dataSourceName, isDataSourceUnavailable, nameValue } = useMemo(() => {
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
    if (!model.context.flowSettingsEnabled) {
      return null;
    }
    return <DataSourceUnavailablePlaceholder dataSourceName={dataSourceName} />;
  }

  return (
    <BlockItemCard>
      <Result status="403" subTitle={messageValue}></Result>
    </BlockItemCard>
  );
};

export function BlockDeletePlaceholder() {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const { dataSourceName, isDataSourceUnavailable, nameValue } = useMemo(() => {
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
    if (!model.context.flowSettingsEnabled) {
      return null;
    }
    return <DataSourceUnavailablePlaceholder dataSourceName={dataSourceName} />;
  }

  return (
    <BlockItemCard>
      <Result status="404" subTitle={messageValue}></Result>
    </BlockItemCard>
  );
}
