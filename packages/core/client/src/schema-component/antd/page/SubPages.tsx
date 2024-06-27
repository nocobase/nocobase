/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecursionField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import {
  useCollectionParentRecord,
  useCollectionRecord,
} from '../../../data-source/collection-record/CollectionRecordProvider';
import { useAssociationName } from '../../../data-source/collection/AssociationProvider';
import { useCollectionManager } from '../../../data-source/collection/CollectionManagerProvider';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { DataBlockProvider } from '../../../data-source/data-block/DataBlockProvider';
import { useDataSourceKey } from '../../../data-source/data-source/DataSourceProvider';
import {
  VariablePopupRecordProvider,
  useParentPopupRecord,
} from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { ActionContext } from '../action/context';
import { TabsContextProvider } from '../tabs/context';
import { PagePopups, useRequestSchema } from './PagePopups';
import { usePopupSettings } from './PopupSettingsProvider';
import { useSubPagesStyle } from './SubPages.style';
import { PopupParams, getPopupParamsFromPath } from './pagePopupUtils';
import {
  SubPageContext,
  getSubPageContextFromPopupSchema,
  usePopupContextInActionOrAssociationField,
} from './usePopupContextInActionOrAssociationField';

export interface SubPageParams extends Omit<PopupParams, 'popupuid'> {
  /** sub page uid */
  subpageuid: string;
}

const SubPageTabsPropsProvider: FC<{ params: SubPageParams }> = (props) => {
  const navigate = useNavigateNoUpdate();
  const onTabClick = useCallback((key: string) => {
    let pathname = window.location.pathname.split('/tab/')[0];
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    navigate(`${pathname}/tab/${key}`);
  }, []);

  return (
    <TabsContextProvider activeKey={props.params.tab} onTabClick={onTabClick}>
      {props.children}
    </TabsContextProvider>
  );
};

const SubPageProvider: FC<{ params: SubPageParams; context: SubPageContext | undefined }> = (props) => {
  const { params, context } = props;

  if (!context) {
    return null;
  }

  const commonElements = (
    <DataBlockProvider
      dataSource={context.dataSource}
      collection={context.collection}
      association={context.association}
      sourceId={context.sourceId}
      filterByTk={params.filterbytk}
      action="get"
    >
      <SubPageTabsPropsProvider params={props.params}>
        <VariablePopupRecordProvider>{props.children}</VariablePopupRecordProvider>
      </SubPageTabsPropsProvider>
    </DataBlockProvider>
  );

  if (context.parentPopupRecord) {
    return (
      <DataBlockProvider
        dataSource={context.dataSource}
        collection={context.parentPopupRecord.collection}
        filterByTk={context.parentPopupRecord.filterByTk}
        action="get"
      >
        <VariablePopupRecordProvider>{commonElements}</VariablePopupRecordProvider>
      </DataBlockProvider>
    );
  }

  return commonElements;
};

export const SubPage = () => {
  const params: any = useParams();
  const { subPageParams, popupParams } = getSubPageParamsAndPopupsParams(params['*']);
  const { styles } = useSubPagesStyle();
  const { requestSchema } = useRequestSchema();
  const [subPageSchema, setSubPageSchema] = useState(null);

  useEffect(() => {
    const run = async () => {
      const schema = await requestSchema(subPageParams.subpageuid);
      setSubPageSchema(schema);
    };
    run();
  }, [subPageParams.subpageuid]);

  if (!subPageSchema || subPageSchema['x-uid'] !== subPageParams.subpageuid) {
    return null;
  }

  const context = getSubPageContextFromPopupSchema(subPageSchema) as SubPageContext;

  return (
    <div className={styles.container}>
      <SubPageProvider params={subPageParams} context={context}>
        <RecursionField schema={subPageSchema} onlyRenderProperties />
        {_.isEmpty(popupParams) ? null : <PagePopups paramsList={popupParams} />}
      </SubPageProvider>
    </div>
  );
};

export const getSubPagePathFromParams = (params: SubPageParams) => {
  const { subpageuid, tab, filterbytk } = params;
  const popupPath = [subpageuid, filterbytk && 'filterbytk', filterbytk, tab && 'tab', tab].filter(Boolean);

  return `/subpages/${popupPath.join('/')}`;
};

export const getSubPageParamsFromPath = _.memoize((path: string) => {
  const [subPageUid, ...subPageParams] = path.split('/').filter(Boolean);
  const result = {};

  for (let i = 0; i < subPageParams.length; i += 2) {
    result[subPageParams[i]] = subPageParams[i + 1];
  }

  return {
    subpageuid: subPageUid,
    ...result,
  } as SubPageParams;
});

export const useNavigateTOSubPage = () => {
  const navigate = useNavigateNoUpdate();
  const fieldSchema = useFieldSchema();
  const dataSourceKey = useDataSourceKey();
  const record = useCollectionRecord();
  const parentRecord = useCollectionParentRecord();
  const collection = useCollection();
  const cm = useCollectionManager();
  const association = useAssociationName();
  const { updatePopupContext } = usePopupContextInActionOrAssociationField();
  const { value: parentPopupRecordData, collection: parentPopupRecordCollection } = useParentPopupRecord() || {};
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { setVisible: setVisibleFromAction } = useContext(ActionContext);

  const navigateToSubPage = useCallback(() => {
    if (!fieldSchema['x-uid']) {
      return;
    }

    if (!isPopupVisibleControlledByURL) {
      return setVisibleFromAction?.(true);
    }

    const subPageUid = fieldSchema.properties[Object.keys(fieldSchema.properties)[0]]['x-uid'];
    const filterByTK = record?.data?.[collection.getPrimaryKey()];
    const sourceId = parentRecord?.data?.[cm.getCollection(association?.split('.')[0])?.getPrimaryKey()];
    const params = {
      subpageuid: subPageUid,
      filterbytk: filterByTK,
    };

    updatePopupContext({
      dataSource: dataSourceKey,
      collection: association ? undefined : collection.name,
      association: association,
      sourceId,
      // @ts-ignore
      parentPopupRecord: parentPopupRecordData
        ? {
            collection: parentPopupRecordCollection?.name,
            filterByTk: parentPopupRecordData[parentPopupRecordCollection.getPrimaryKey()],
          }
        : undefined,
    });

    const pathname = getSubPagePathFromParams(params);
    navigate(`/admin${pathname}`);
  }, [fieldSchema, navigate, dataSourceKey, record, parentRecord, collection, cm, association, parentPopupRecordData]);

  return { navigateToSubPage };
};

export const getSubPageParamsAndPopupsParams = _.memoize((path: string) => {
  const [pagePath, ...popupsPath] = path.split('/popups/');
  const subPageParams = getSubPageParamsFromPath(pagePath);
  const popupParams = getPopupParamsFromPath(popupsPath.join('/popups/'));

  return { subPageParams, popupParams };
});
