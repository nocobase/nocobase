/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, RecursionField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import {
  useCollectionParentRecord,
  useCollectionRecord,
  useCollectionRecordData,
} from '../../../data-source/collection-record/CollectionRecordProvider';
import { useAssociationName } from '../../../data-source/collection/AssociationProvider';
import { useCollectionManager } from '../../../data-source/collection/CollectionManagerProvider';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { DataBlockProvider } from '../../../data-source/data-block/DataBlockProvider';
import { useDataBlockRequest } from '../../../data-source/data-block/DataBlockRequestProvider';
import { useDataSourceKey } from '../../../data-source/data-source/DataSourceProvider';
import { TreeRecordProvider, useTreeParentRecord } from '../../../modules/blocks/data-blocks/table/TreeRecordProvider';
import {
  VariablePopupRecordProvider,
  useCurrentPopupRecord,
} from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { ActionContext } from '../action/context';
import { TabsContextProvider } from '../tabs/context';
import { PagePopups, useRequestSchema } from './PagePopups';
import { usePopupSettings } from './PopupSettingsProvider';
import { useSubPagesStyle } from './SubPages.style';
import {
  PopupParams,
  decodePathValue,
  encodePathValue,
  getPopupParamsFromPath,
  getStoredPopupContext,
  storePopupContext,
  withSearchParams,
} from './pagePopupUtils';
import {
  SubPageContext,
  getPopupContextFromActionOrAssociationFieldSchema,
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

const TreeRecordProviderInSubPage: FC = (props) => {
  const recordData = useCollectionRecordData();
  return <TreeRecordProvider parent={recordData}>{props.children}</TreeRecordProvider>;
};

const SubPageProvider: FC<{ params: SubPageParams; context: SubPageContext | undefined; actionType: string }> = (
  props,
) => {
  const { params, context } = props;

  if (!context) {
    return null;
  }

  const nodes = {
    addChild: <TreeRecordProviderInSubPage>{props.children}</TreeRecordProviderInSubPage>,
    '': <VariablePopupRecordProvider>{props.children}</VariablePopupRecordProvider>,
  };

  const commonElements = (
    <DataBlockProvider
      dataSource={context.dataSource}
      collection={context.collection}
      association={context.association}
      sourceId={context.sourceId}
      filterByTk={params.filterbytk}
      action="get"
    >
      <SubPageTabsPropsProvider params={props.params}>{nodes[props.actionType]}</SubPageTabsPropsProvider>
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
  const location = useLocation();
  const { subPageParams, popupParams } = getSubPageParamsAndPopupsParams(getSubPagePath(location));
  const { styles } = useSubPagesStyle();
  const { requestSchema } = useRequestSchema();
  const [actionSchema, setActionSchema] = useState(null);

  useEffect(() => {
    const run = async () => {
      const stored = getStoredPopupContext(subPageParams.subpageuid);

      if (stored) {
        return setActionSchema(stored.schema);
      }

      const schema = await requestSchema(subPageParams.subpageuid);
      setActionSchema(schema);
    };
    run();
  }, [subPageParams.subpageuid]);

  // When the URL changes, this component may be re-rendered, because at this time the Schema is still old, so there may be some issues, so here is a judgment.
  if (!actionSchema || actionSchema['x-uid'] !== subPageParams.subpageuid) {
    return null;
  }

  const subPageSchema = Object.values(actionSchema.properties)[0] as ISchema;
  const context = getPopupContextFromActionOrAssociationFieldSchema(actionSchema) as SubPageContext;
  const addChild = actionSchema?.['x-component-props']?.addChild;

  return (
    <div className={styles.container}>
      <SubPageProvider params={subPageParams} context={context} actionType={addChild ? 'addChild' : ''}>
        <RecursionField schema={subPageSchema} onlyRenderProperties />
        {_.isEmpty(popupParams) ? null : <PagePopups paramsList={popupParams} />}
      </SubPageProvider>
    </div>
  );
};

export const getSubPagePathFromParams = (params: SubPageParams) => {
  const { subpageuid, tab, filterbytk } = params;
  const popupPath = [subpageuid, filterbytk && 'filterbytk', filterbytk, tab && 'tab', tab].filter(Boolean);

  return `/subpages/${popupPath.map((item) => encodePathValue(item)).join('/')}`;
};

export const getSubPageParamsFromPath = _.memoize((path: string) => {
  const [subPageUid, ...subPageParams] = path.split('/').filter(Boolean);
  const result = {};

  for (let i = 0; i < subPageParams.length; i += 2) {
    result[subPageParams[i]] = decodePathValue(subPageParams[i + 1]);
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
  const { value: parentPopupRecordData, collection: parentPopupRecordCollection } = useCurrentPopupRecord() || {};
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { setVisible: setVisibleFromAction } = useContext(ActionContext);
  const service = useDataBlockRequest();
  const treeParentRecord = useTreeParentRecord();

  const navigateToSubPage = useCallback(() => {
    if (!fieldSchema['x-uid']) {
      return;
    }

    if (!isPopupVisibleControlledByURL) {
      return setVisibleFromAction?.(true);
    }

    const filterByTK = cm.getFilterByTK(association || collection, record?.data || treeParentRecord);
    const sourceId = parentRecord?.data?.[cm.getSourceKeyByAssociation(association)];
    const params = {
      subpageuid: fieldSchema['x-uid'],
      filterbytk: filterByTK,
    };

    storePopupContext(fieldSchema['x-uid'], {
      schema: fieldSchema,
      record,
      parentRecord,
      service,
      dataSource: dataSourceKey,
      collection: collection.name,
      association,
      sourceId,
      parentPopupRecord: parentPopupRecordData
        ? {
            // TODO: 这里应该需要 association 的 值
            collection: parentPopupRecordCollection?.name,
            filterByTk: cm.getFilterByTK(parentPopupRecordCollection, parentPopupRecordData),
          }
        : undefined,
    });

    updatePopupContext({
      dataSource: dataSourceKey,
      collection: association ? undefined : collection.name,
      association: association,
      sourceId,
      parentPopupRecord: parentPopupRecordData
        ? {
            collection: parentPopupRecordCollection?.name,
            filterByTk: cm.getFilterByTK(parentPopupRecordCollection, parentPopupRecordData),
          }
        : undefined,
    });

    const pathname = getSubPagePathFromParams(params);
    navigate(withSearchParams(`/admin${pathname}`));
  }, [
    fieldSchema,
    navigate,
    dataSourceKey,
    record,
    parentRecord,
    collection,
    cm,
    association,
    parentPopupRecordData,
    isPopupVisibleControlledByURL,
    service,
  ]);

  return { navigateToSubPage };
};

export const getSubPageParamsAndPopupsParams = _.memoize((path: string) => {
  const [pagePath, ...popupsPath] = path.split('/popups/');
  const subPageParams = getSubPageParamsFromPath(pagePath);
  const popupParams = getPopupParamsFromPath(popupsPath.join('/popups/'));

  return { subPageParams, popupParams };
});

/**
 * The reason why we don't use the decoded data returned by useParams here is because we need the raw values.
 * @param location
 * @returns
 */
export function getSubPagePath(location: Location) {
  const [, subPagePath] = location.pathname.split('/admin/subpages/');
  return subPagePath || '';
}
