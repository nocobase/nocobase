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
import { ActionContext } from '../action/context';
import { PopupVisibleProviderContext, useCurrentPopupContext } from './PagePopups';
import { usePopupSettings } from './PopupSettingsProvider';
import { PopupContext, usePopupContextInActionOrAssociationField } from './usePopupContextInActionOrAssociationField';

export interface PopupParams {
  /** popup uid */
  popupuid: string;
  /** record id */
  filterbytk?: string;
  /** source id */
  sourceid?: string;
  /** tab uid */
  tab?: string;
  /** collection name */
  collection?: string;
}

export interface PopupContextStorage extends PopupContext {
  schema?: ISchema;
  record?: CollectionRecord;
  parentRecord?: CollectionRecord;
  /** used to refresh data for block */
  service?: any;
  sourceId?: string;
  /**
   * if true, will not back to the previous path when closing the popup
   */
  notBackToPreviousPath?: boolean;
}

const popupsContextStorage: Record<string, PopupContextStorage> = {};

export const getStoredPopupContext = (popupUid: string) => {
  return popupsContextStorage[popupUid];
};

/**
 * Used to store the context of the current popup.
 *
 * The context that has already been stored, when displaying the popup,
 * will directly retrieve the context information from the cache instead of making an API request.
 * @param popupUid
 * @param params
 */
export const storePopupContext = (popupUid: string, params: PopupContextStorage) => {
  popupsContextStorage[popupUid] = params;
};

const blockServicesStorage: Record<string, { service: any }> = {};

export const getBlockService = (popupUid: string) => {
  return blockServicesStorage[popupUid];
};

/**
 * Used to store the service of the block when rendering the button.
 * @param popupUid
 * @param value
 */
export const storeBlockService = (popupUid: string, value: { service: any }) => {
  blockServicesStorage[popupUid] = value;
};

export const getPopupParamsFromPath = _.memoize((path: string) => {
  const popupPaths = path.split('/popups/');
  return popupPaths.filter(Boolean).map((popupPath) => {
    const [popupUid, ...popupParams] = popupPath.split('/').filter(Boolean);
    const obj = {};

    for (let i = 0; i < popupParams.length; i += 2) {
      obj[popupParams[i]] = decodePathValue(popupParams[i + 1]);
    }

    return {
      popupuid: popupUid,
      ...obj,
    } as PopupParams;
  });
});

export const getPopupPathFromParams = (params: PopupParams) => {
  const { popupuid: popupUid, tab, filterbytk, sourceid, collection } = params;
  const popupPath = [
    popupUid,
    collection && 'collection',
    collection,
    filterbytk && 'filterbytk',
    filterbytk,
    sourceid && 'sourceid',
    sourceid,
    tab && 'tab',
    tab,
  ].filter(Boolean);

  return `/popups/${popupPath.map((item) => encodePathValue(item)).join('/')}`;
};

/**
 * Note: use this hook in a plugin is not recommended
 * @returns
 */
export const usePopupUtils = () => {
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
  const { params: popupParams } = useCurrentPopupContext();
  const service = useDataBlockRequest();
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { setVisible: setVisibleFromAction } = useContext(ActionContext);
  const { updatePopupContext } = usePopupContextInActionOrAssociationField();
  const getSourceId = useCallback(
    (_parentRecordData?: Record<string, any>) =>
      (_parentRecordData || parentRecord?.data)?.[cm.getSourceKeyByAssociation(association)],
    [parentRecord, association],
  );
  const currentPopupUidWithoutOpened = fieldSchema?.['x-uid'];

  const getNewPathname = useCallback(
    ({
      tabKey,
      popupUid,
      recordData,
      sourceId,
      collection: _collection,
    }: {
      popupUid: string;
      recordData: Record<string, any>;
      sourceId: string;
      tabKey?: string;
      collection?: string;
    }) => {
      const filterByTK = cm.getFilterByTK(association || collection, recordData);
      return getPopupPathFromParams({
        popupuid: popupUid,
        collection: _collection,
        filterbytk: filterByTK,
        sourceid: sourceId,
        tab: tabKey,
      });
    },
    [association, cm, collection, dataSourceKey, parentRecord?.data, association],
  );

  const getPopupContext = useCallback(() => {
    const context = {
      dataSource: dataSourceKey,
      collection: association ? undefined : collection.name,
      association,
    };

    return _.omitBy(context, _.isNil) as PopupContext;
  }, [dataSourceKey, collection, association]);

  const openPopup = useCallback(
    ({
      recordData,
      parentRecordData,
      collectionNameUsedInURL,
    }: {
      recordData?: Record<string, any>;
      parentRecordData?: Record<string, any>;
      /** if this value exists, it will be saved in the URL */
      collectionNameUsedInURL?: string;
    } = {}) => {
      if (!isPopupVisibleControlledByURL()) {
        return setVisibleFromAction?.(true);
      }

      const sourceId = getSourceId(parentRecordData);

      recordData = recordData || record?.data;
      const pathname = getNewPathname({
        popupUid: currentPopupUidWithoutOpened,
        recordData,
        sourceId,
        collection: collectionNameUsedInURL,
      });
      let url = location.pathname;
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }

      storePopupContext(currentPopupUidWithoutOpened, {
        schema: fieldSchema,
        record: new CollectionRecord({ isNew: false, data: recordData }),
        parentRecord: parentRecordData ? new CollectionRecord({ isNew: false, data: parentRecordData }) : parentRecord,
        service,
        dataSource: dataSourceKey,
        collection: collection.name,
        association,
        sourceId,
      });

      updatePopupContext(getPopupContext());

      navigate(withSearchParams(`${url}${pathname}`));
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
      getSourceId,
      getPopupContext,
      currentPopupUidWithoutOpened,
    ],
  );

  const closePopup = useCallback(
    (currentPopupUid: string) => {
      if (!isPopupVisibleControlledByURL()) {
        return setVisibleFromAction?.(false);
      }

      // 1. If there is a value in the cache, it means that the current popup was opened by manual click, so we can simply return to the previous record;
      // 2. If there is no value in the cache, it means that the current popup was opened by clicking the URL elsewhere, and since there is no history,
      //    we need to construct the URL of the previous record to return to;
      if (getStoredPopupContext(currentPopupUid) && !getStoredPopupContext(currentPopupUid).notBackToPreviousPath) {
        navigate(-1);
      } else {
        navigate(withSearchParams(removeLastPopupPath(location.pathname)));
      }
    },
    [isPopupVisibleControlledByURL, setVisibleFromAction, navigate, location?.pathname],
  );

  const changeTab = useCallback(
    (key: string) => {
      const sourceId = getSourceId();
      const pathname = getNewPathname({
        tabKey: key,
        popupUid: popupParams?.popupuid,
        recordData: record?.data,
        sourceId,
      });
      let url = removeLastPopupPath(location.pathname);
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }
      navigate(`${url}${pathname}`, {
        replace: true,
      });
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
    /**
     * @deprecated
     * TODO: remove this
     */
    visibleWithURL: visible,
    /**
     * @deprecated
     * TODO: remove this
     */
    setVisibleWithURL: setVisible,
    /**
     * @deprecated
     * TODO: remove this
     */
    popupParams,
    /**
     * @deprecated
     * TODO: remove this
     */
    changeTab,
    /**
     * @deprecated
     * TODO: remove this
     */
    getPopupContext,
  };
};

// e.g. /popups/popupUid/popups/popupUid2 -> /popups/popupUid/
export function removeLastPopupPath(path: string) {
  if (!path.includes('popups')) {
    return path;
  }

  const result = path.split('popups').slice(0, -1).join('popups');

  return result.endsWith('/') ? result.slice(0, -1) : result;
}

export function withSearchParams(path: string) {
  return `${path}${window.location.search}`;
}

/**
 * Prevent problems when "popups" appears in the path
 * @param value
 * @returns
 */
export function encodePathValue(value: string) {
  const encodedValue = encodeURIComponent(value);
  if (encodedValue === 'popups') {
    return window.btoa(value);
  }
  return encodedValue;
}

/**
 * Prevent problems when "popups" appears in the path
 * @param value
 * @returns
 */
export function decodePathValue(value: string) {
  if (value === window.btoa('popups')) {
    return 'popups';
  }
  return decodeURIComponent(value);
}
