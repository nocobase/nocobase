/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { Collection } from '../../../data-source/collection/Collection';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { DeclareVariable } from '../DeclareVariable';
import { useVariable } from '../useVariable';

export const VariablePopupRecordProvider: FC<{
  recordData?: Record<string, any>;
  collection?: Collection;
}> = (props) => {
  const { t } = useTranslation();
  const recordData = useCollectionRecordData();
  const collection = useCollection();
  const parent = useVariable('$nPopupRecord');

  return (
    <DeclareVariable
      name="$nParentPopupRecord"
      title={t('Parent popup record')}
      value={parent.value}
      collection={parent.collection}
    >
      <DeclareVariable
        name="$nPopupRecord"
        title={t('Current popup record')}
        value={props.recordData || recordData}
        collection={props.collection || collection}
      >
        {props.children}
      </DeclareVariable>
    </DeclareVariable>
  );
};
