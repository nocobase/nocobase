/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useCallback, useContext, useMemo } from 'react';
import { useLocationNoUpdate, useNavigateNoUpdate } from '../../../application';
import {
  CollectionRecord,
  useAssociationName,
  useCollection,
  useCollectionManager,
  useCollectionParentRecord,
  useCollectionRecord,
  useDataBlockRequest,
  useDataSourceKey,
} from '../../../data-source';
import { useParentPopupRecord } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { ActionContext } from '../action/context';
import { PopupParamsProviderContext, PopupVisibleProviderContext } from './PagePopups';
import { usePopupSettings } from './PopupSettingsProvider';
import { PopupContext, usePopupContextInActionOrAssociationField } from './usePopupContextInActionOrAssociationField';

export interface PopupParams {
  /** popup uid */
  popupuid: string;
  /** record id */
  filterbytk?: string;
  /** tab uid */
  tab?: string;
}

export interface PopupContextStorage extends PopupContext {
  schema?: ISchema;
  record?: CollectionRecord;
  parentRecord?: CollectionRecord;
  /** used to refresh data for block */
  service?: any;
}

const popupsContextStorage: Record<string, PopupContextStorage> = {};

export const getStoredPopupContext = (popupUid: string) => {
  return popupsContextStorage[popupUid];
};

export const storePopupContext = (popupUid: string, params: PopupContextStorage) => {
  popupsContextStorage[popupUid] = params;
};

export const getPopupParamsFromPath = _.memoize((path: string) => {
  const popupPaths = path.split('popups');
  return popupPaths.filter(Boolean).map((popupPath) => {
    const [popupUid, ...popupParams] = popupPath.split('/').filter(Boolean);
    const obj = {};

    for (let i = 0; i < popupParams.length; i += 2) {
      obj[popupParams[i]] = popupParams[i + 1];
    }

    return {
      popupuid: popupUid,
      ...obj,
    } as PopupParams;
  });
});

export const getPopupPathFromParams = (params: PopupParams) => {
  const { popupuid: popupUid, tab, filterbytk } = params;
  const popupPath = [popupUid, filterbytk && 'filterbytk', filterbytk, tab && 'tab', tab].filter(Boolean);

  return `/popups/${popupPath.join('/')}`;
};

export const usePagePopup = () => {
  const navigate = useNavigateNoUpdate();
  const location = useLocationNoUpdate();
  const fieldSchema = useFieldSchema();
  const dataSourceKey = useDataSourceKey();
  const record = useCollectionRecord();
  const parentRecord = useCollectionParentRecord();
  const collection = useCollection();
  const cm = useCollectionManager();
  const association = useAssociationName();
  const { visible, setVisible } = useContext(PopupVisibleProviderContext) || { visible: false, setVisible: () => {} };
  const { params: popupParams } = useContext(PopupParamsProviderContext) || {};
  const service = useDataBlockRequest();
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { setVisible: setVisibleFromAction } = useContext(ActionContext);
  const { updatePopupContext } = usePopupContextInActionOrAssociationField();
  const { value: parentPopupRecordData, collection: parentPopupRecordCollection } = useParentPopupRecord() || {};
  const sourceId = useMemo(
    () => parentRecord?.data?.[cm.getCollection(association?.split('.')[0])?.getPrimaryKey()],
    [parentRecord, association],
  );

  const getNewPathname = useCallback(
    ({ tabKey, popupUid, recordData }: { tabKey?: string; popupUid: string; recordData: Record<string, any> }) => {
      const filterByTK = recordData?.[collection.getPrimaryKey()];
      return getPopupPathFromParams({
        popupuid: popupUid,
        filterbytk: filterByTK,
        tab: tabKey,
      });
    },
    [association, cm, collection, dataSourceKey, parentRecord?.data],
  );

  const getPopupContext = useCallback(() => {
    return {
      dataSource: dataSourceKey,
      collection: association ? undefined : collection.name,
      association,
      sourceId,
      parentPopupRecord: parentPopupRecordData
        ? {
            collection: parentPopupRecordCollection?.name,
            filterByTk: parentPopupRecordData[parentPopupRecordCollection.getPrimaryKey()],
          }
        : undefined,
    };
  }, [dataSourceKey, collection, association, sourceId, parentPopupRecordData, parentPopupRecordCollection]);

  const openPopup = useCallback(
    ({
      recordData,
    }: {
      recordData?: Record<string, any>;
    } = {}) => {
      if (!isPopupVisibleControlledByURL) {
        return setVisibleFromAction?.(true);
      }

      recordData = recordData || record?.data;
      const pathname = getNewPathname({ popupUid: fieldSchema['x-uid'], recordData });
      let url = location.pathname;
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }

      storePopupContext(fieldSchema['x-uid'], {
        schema: fieldSchema,
        record: new CollectionRecord({ isNew: false, data: recordData }),
        parentRecord,
        service,
        dataSource: dataSourceKey,
        collection: collection.name,
        association,
        sourceId,
        parentPopupRecord: parentPopupRecordData
          ? {
              collection: parentPopupRecordCollection?.name,
              filterByTk: parentPopupRecordData[parentPopupRecordCollection.getPrimaryKey()],
            }
          : undefined,
      });

      updatePopupContext(getPopupContext());

      navigate(`${url}${pathname}`);
    },
    [
      association,
      cm,
      collection,
      dataSourceKey,
      fieldSchema,
      getNewPathname,
      navigate,
      parentRecord,
      record,
      service,
      location,
      isPopupVisibleControlledByURL,
      parentPopupRecordData,
      sourceId,
      getPopupContext,
    ],
  );

  const closePopup = useCallback(() => {
    if (!isPopupVisibleControlledByURL) {
      return setVisibleFromAction?.(false);
    }

    navigate(removeLastPopupPath(location.pathname));
  }, [navigate, location, isPopupVisibleControlledByURL]);

  const changeTab = useCallback(
    (key: string) => {
      const pathname = getNewPathname({ tabKey: key, popupUid: popupParams?.popupuid, recordData: record?.data });
      let url = removeLastPopupPath(location.pathname);
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }
      navigate(`${url}${pathname}`);
    },
    [getNewPathname, navigate, popupParams?.popupuid, record?.data, location],
  );

  return {
    /**
     * used to open popup by changing the url
     */
    openPopup,
    /**
     * used to close popup by changing the url
     */
    closePopup,
    visibleWithURL: visible,
    setVisibleWithURL: setVisible,
    popupParams,
    changeTab,
    getPopupContext,
  };
};

// e.g. /popups/popupUid/popups/popupUid2 -> /popups/popupUid
export function removeLastPopupPath(path: string) {
  if (!path.includes('popups')) {
    return path;
  }
  return path.split('popups').slice(0, -1).join('popups');
}
