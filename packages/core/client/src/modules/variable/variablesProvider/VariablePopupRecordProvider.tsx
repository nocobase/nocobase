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
import { useForm } from '@formily/react';
import { useCollectionRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { Collection } from '../../../data-source/collection/Collection';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { DeclareVariableProps } from '../types';

const CurrentPopupRecordContext = React.createContext<DeclareVariableProps>(null);
const CurrentParentPopupRecordContext = React.createContext<DeclareVariableProps>(null);

export const VariablePopupRecordProvider: FC<{
  recordData?: Record<string, any>;
  collection?: Collection;
  parent?: {
    recordData?: Record<string, any>;
    collection?: Collection;
  };
}> = React.memo((props) => {
  const { t } = useTranslation();
  const recordData = useCollectionRecordData();
  const collection = useCollection();
  const parent = useCurrentPopupRecord();

  return (
    <CurrentParentPopupRecordContext.Provider
      value={{
        name: '$nParentPopupRecord',
        title: t('Parent popup record'),
        value: props.parent?.recordData || parent?.value,
        collection: props.parent?.collection || parent?.collection,
      }}
    >
      <CurrentPopupRecordContext.Provider
        value={{
          name: '$nPopupRecord',
          title: t('Current popup record'),
          value: props.recordData || recordData,
          collection: props.collection || collection,
        }}
      >
        {props.children}
      </CurrentPopupRecordContext.Provider>
    </CurrentParentPopupRecordContext.Provider>
  );
});

VariablePopupRecordProvider.displayName = 'VariablePopupRecordProvider';

export const useCurrentPopupRecord = () => {
  return React.useContext(CurrentPopupRecordContext);
};

export const useParentPopupRecord = () => {
  return React.useContext(CurrentParentPopupRecordContext);
};
