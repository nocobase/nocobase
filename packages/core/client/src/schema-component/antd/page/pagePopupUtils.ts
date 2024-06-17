/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAssociationName,
  useCollection,
  useCollectionManager,
  useCollectionParentRecordData,
  useCollectionRecordData,
  useDataSourceKey,
} from '../../../data-source';
import { PopupsProviderContext } from './PagePopups';

export interface PopupParam {
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

export const getPopupParamsFromPath = (path: string) => {
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
    } as PopupParam;
  });
};

export const getPopupPathFromParams = (params: PopupParam) => {
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

export const usePopup = () => {
  const navigate = useNavigate();
  const fieldSchema = useFieldSchema();
  const dataSourceKey = useDataSourceKey();
  const recordData = useCollectionRecordData();
  const parentRecordData = useCollectionParentRecordData();
  const collection = useCollection();
  const cm = useCollectionManager();
  const association = useAssociationName();
  const { visible, setVisible } = useContext(PopupsProviderContext) || {};

  const openPopup = useCallback(
    ({ onFail }: { onFail?: () => void } = {}) => {
      if (!fieldSchema['x-uid']) {
        return onFail?.();
      }

      const pathname = getPopupPathFromParams({
        popupUid: fieldSchema['x-uid'],
        datasource: dataSourceKey,
        filterbytk: recordData?.[collection.getPrimaryKey()],
        collection: collection.name,
        association,
        sourceid: parentRecordData?.[cm.getCollection(association?.split('.')[0])?.getPrimaryKey()],
      });
      let url = window.location.pathname;
      if (_.last(url) === '/') {
        url = url.slice(0, -1);
      }

      navigate(`${url}${pathname}`);
    },
    [association, cm, collection, dataSourceKey, fieldSchema, navigate, parentRecordData, recordData],
  );

  const closePopup = useCallback(() => {
    navigate(removeLastPopupPath(window.location.pathname));
  }, [navigate]);

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
  };
};

// e.g. /popups/popupUid/popups/popupUid2 -> /popups/popupUid
export function removeLastPopupPath(path: string) {
  if (!path.includes('popups')) {
    return path;
  }
  return path.split('popups').slice(0, -1).join('popups');
}
