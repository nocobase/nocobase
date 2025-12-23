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

export const BlockPlaceholder = () => {
  const { t } = useTranslation();
  const model: BlockModel = useFlowModel();
  const blockModel = model.context.blockModel;
  const collection = model.context.collectionField?.targetCollection || blockModel.collection;
  const dataSource = collection.dataSource;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} ` : '';
    return `${dataSourcePrefix}${collectionPrefix}`;
  }, []);

  const { actionName } = model.forbidden;
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for collection "{{name}}"`,
      {
        name: nameValue,
        actionName: t(_.capitalize(actionName)),
      },
    ).replaceAll('&gt;', '>');
  }, [actionName, nameValue, t]);
  return (
    <BlockItemCard>
      <Result status="403" subTitle={messageValue}></Result>
    </BlockItemCard>
  );
};

export function BlockDeletePlaceholder() {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const dataSource = model.dataSource;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = model.resource.resourceName;
    return `${dataSourcePrefix}${collectionPrefix}`;
  }, []);
  const messageValue = useMemo(() => {
    return t(`The {{type}} "{{name}}" may have been deleted. Please remove this {{blockType}}.`, {
      type: t('Collection'),
      name: nameValue,
      blockType: t('Block'),
    }).replaceAll('&gt;', '>');
  }, [nameValue, t]);
  return (
    <BlockItemCard>
      <Result status="404" subTitle={messageValue}></Result>
    </BlockItemCard>
  );
}
