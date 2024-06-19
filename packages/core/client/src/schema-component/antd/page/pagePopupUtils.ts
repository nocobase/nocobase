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
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PopupsProviderContext, PopupsVisibleProviderContext } from './PagePopups';

export interface PopupParams {
  /** popup uid */
  popupUid: string;
  /** data source */
  datasource: string;
  /** tab uid */
  tab?: string;
  /** record id */
  filterbytk?: string;
  /** collection name */
  collection?: string;
  /**
   * e.g. 'user.roles'
   */
  association?: string;
  /**
   * used to get parent record
   */
  sourceid?: string;
}

export interface PopupParamsStorage extends PopupParams {
  schema?: ISchema;
  record?: CollectionRecord;
  parentRecord?: CollectionRecord;
  /** used to refresh data for block */
  service?: any;
}

const popupParamsStorage: Record<string, PopupParamsStorage> = {};

export const getStoredPopupParams = (popupUid: string) => {
  return popupParamsStorage[popupUid];
};

export const storePopupParams = (popupUid: string, params: PopupParamsStorage) => {
  popupParamsStorage[popupUid] = params;
};

export const getPopupParamsFromPath = _.memoize((path: string) => {
  const popupPaths = path.split('popups');
  return popupPaths.map((popupPath) => {
    const [popupUid, ...popupParams] = popupPath.split('/').filter(Boolean);
    const obj = {};

    for (let i = 0; i < popupParams.length; i += 2) {
      obj[popupParams[i]] = popupParams[i + 1];
    }

    return {
      popupUid,
      ...obj,
    } as PopupParams;
  });
});

export const getPopupPathFromParams = (params: PopupParams) => {
  const { popupUid, tab, datasource, filterbytk, collection, association, sourceid } = params;
  const popupPath = [
    popupUid,
    'datasource',
    datasource,
    'filterbytk',
    filterbytk,
    collection && 'collection',
    collection,
    association && 'association',
    association,
    sourceid && 'sourceid',
    sourceid,
    tab && 'tab',
    tab,
  ].filter(Boolean);

  return `/popups/${popupPath.join('/')}`;
};

export const usePagePopup = () => {
  const navigate = useNavigate();
  const fieldSchema = useFieldSchema();
  const dataSourceKey = useDataSourceKey();
  const record = useCollectionRecord();
  const parentRecord = useCollectionParentRecord();
  const collection = useCollection();
  const cm = useCollectionManager();
  const association = useAssociationName();
  const { visible, setVisible } = useContext(PopupsVisibleProviderContext) || {};
  const { popupParams } = useContext(PopupsProviderContext) || {};
  const service = useDataBlockRequest();

  const getNewPathname = useCallback(
    ({ tabKey, popupUid }: { tabKey?: string; popupUid: string }) => {
      const filterByTK = record?.data?.[collection.getPrimaryKey()];
      const sourceId = parentRecord?.data?.[cm.getCollection(association?.split('.')[0])?.getPrimaryKey()];
      return getPopupPathFromParams({
        popupUid: popupUid,
        datasource: dataSourceKey,
        filterbytk: filterByTK,
        collection: association ? undefined : collection.name,
        association,
        sourceid: sourceId,
        tab: tabKey,
      });
    },
    [association, cm, collection, dataSourceKey, parentRecord?.data, record?.data],
  );

  const openPopup = useCallback(
    ({
      onFail,
    }: {
      /**
       * 通过路由的方式打开弹窗失败时的回调
       * @returns
       */
      onFail?: () => void;
    } = {}) => {
      if (!fieldSchema['x-uid']) {
        return onFail?.();
      }

      const filterByTK = record?.data?.[collection.getPrimaryKey()];
      const sourceId = parentRecord?.data?.[cm.getCollection(association?.split('.')[0])?.getPrimaryKey()];
      const pathname = getNewPathname({ popupUid: fieldSchema['x-uid'] });
      let url = window.location.pathname;
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }

      storePopupParams(fieldSchema['x-uid'], {
        schema: fieldSchema,
        popupUid: fieldSchema['x-uid'],
        datasource: dataSourceKey,
        filterbytk: filterByTK,
        collection: collection.name,
        association,
        sourceid: sourceId,
        record,
        parentRecord,
        service,
      });
      navigate(`${url}${pathname}`);
    },
    [association, cm, collection, dataSourceKey, fieldSchema, getNewPathname, navigate, parentRecord, record, service],
  );

  const closePopup = useCallback(() => {
    navigate(removeLastPopupPath(window.location.pathname));
  }, [navigate]);

  const changeTab = useCallback(
    (key: string) => {
      const pathname = getNewPathname({ tabKey: key, popupUid: popupParams?.popupUid });
      let url = removeLastPopupPath(window.location.pathname);
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }
      navigate(`${url}${pathname}`);
    },
    [getNewPathname, navigate, popupParams?.popupUid],
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
  };
};

// e.g. /popups/popupUid/popups/popupUid2 -> /popups/popupUid
export function removeLastPopupPath(path: string) {
  if (!path.includes('popups')) {
    return path;
  }
  return path.split('popups').slice(0, -1).join('popups');
}
