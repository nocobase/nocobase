/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import _ from 'lodash';
import { FC, default as React, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAPIClient } from '../../../api-client';
import { DataBlockProvider } from '../../../data-source/data-block/DataBlockProvider';
import { BlockRequestContext } from '../../../data-source/data-block/DataBlockRequestProvider';
import { SchemaComponent } from '../../core';
import { TabsContextProvider } from '../tabs/context';
import { usePopupSettings } from './PopupSettingsProvider';
import { deleteRandomNestedSchemaKey, getRandomNestedSchemaKey } from './nestedSchemaKeyStorage';
import {
  PopupParams,
  PopupParamsStorage,
  getPopupParamsFromPath,
  getStoredPopupParams,
  usePagePopup,
} from './pagePopupUtils';

interface PopupsVisibleProviderProps {
  visible: boolean;
  setVisible?: (value: boolean) => void;
}
interface PopupsProviderProps {
  popupParams: PopupParams;
}

export const PopupVisibleProviderContext = React.createContext<PopupsVisibleProviderProps>(null);
export const PopupParamsProviderContext = React.createContext<PopupsProviderProps>(null);
PopupVisibleProviderContext.displayName = 'PopupVisibleProviderContext';
PopupParamsProviderContext.displayName = 'PopupParamsProviderContext';

/**
 * The difference between this component and ActionContextProvider is that
 * this component is only used to control the popups in the PagePopupsItem component (excluding the nested popups within it).
 * @param param0
 * @returns
 */
export const PopupVisibleProvider: FC<PopupsVisibleProviderProps> = ({ children, visible, setVisible }) => {
  return (
    <PopupVisibleProviderContext.Provider value={{ visible, setVisible }}>
      {children}
    </PopupVisibleProviderContext.Provider>
  );
};

const PopupParamsProvider: FC<PopupsProviderProps> = (props) => {
  return (
    <PopupParamsProviderContext.Provider value={{ popupParams: props.popupParams }}>
      {props.children}
    </PopupParamsProviderContext.Provider>
  );
};

const PopupTabsPropsProvider: FC<{ params: PopupParamsStorage }> = ({ children, params }) => {
  const { changeTab } = usePagePopup();
  const onTabClick = useCallback(
    (key: string) => {
      changeTab(key);
    },
    [changeTab],
  );
  const { isPopupVisibleControlledByURL } = usePopupSettings();

  if (!isPopupVisibleControlledByURL) {
    return <>{children}</>;
  }

  return (
    <TabsContextProvider activeKey={params.tab} onTabClick={onTabClick}>
      {children}
    </TabsContextProvider>
  );
};

const PagePopupsItemProvider: FC<{ params: PopupParams }> = ({ params, children }) => {
  const { closePopup } = usePagePopup();
  const [visible, _setVisible] = useState(true);
  const setVisible = (visible: boolean) => {
    if (!visible) {
      _setVisible(false);

      if (process.env.__E2E__) {
        setTimeout(() => {
          closePopup();
          // Deleting here ensures that the next time the same popup is opened, it will generate another random key.
          deleteRandomNestedSchemaKey(params.popupUid);
        });
        return;
      }

      // Leave some time to refresh the block data
      setTimeout(() => {
        closePopup();
        // Deleting here ensures that the next time the same popup is opened, it will generate another random key.
        deleteRandomNestedSchemaKey(params.popupUid);
      }, 300);
    }
  };
  const _params: PopupParamsStorage = params;
  const storedParams = { ...getStoredPopupParams(params.popupUid) };
  if (storedParams) {
    Object.assign(storedParams, _params);
  }

  return (
    <PopupParamsProvider popupParams={storedParams}>
      <PopupVisibleProvider visible={visible} setVisible={setVisible}>
        <DataBlockProvider
          dataSource={storedParams.datasource}
          collection={storedParams.collection}
          association={storedParams.association}
          filterByTk={storedParams.filterbytk}
          sourceId={storedParams.sourceid}
          // @ts-ignore
          record={storedParams.record}
          parentRecord={storedParams.parentRecord}
          action="get"
        >
          {/* Pass the service of the block where the button is located down, to refresh the block's data when the popup is closed */}
          <BlockRequestContext.Provider value={storedParams.service}>
            <PopupTabsPropsProvider params={storedParams}>
              <div style={{ display: 'none' }}>{children}</div>
            </PopupTabsPropsProvider>
          </BlockRequestContext.Provider>
        </DataBlockProvider>
      </PopupVisibleProvider>
    </PopupParamsProvider>
  );
};

/**
 * insert childSchema to parentSchema to render the nested popups
 * @param childSchema
 * @param params
 * @param parentSchema
 */
export const insertToPopupSchema = (childSchema: ISchema, params: PopupParams, parentSchema: ISchema) => {
  const componentSchema = {
    type: 'void',
    'x-component': 'PagePopupsItemProvider',
    'x-component-props': {
      params,
    },
    properties: {
      popupAction: childSchema,
    },
  };

  // If we don't use a random name, it will cause the component's parameters not to be updated when reopening the popup
  const nestedPopupKey = getRandomNestedSchemaKey(params.popupUid);

  if (parentSchema.properties) {
    const popupSchema = _.get(parentSchema.properties, Object.keys(parentSchema.properties)[0]);
    if (_.isEmpty(_.get(popupSchema, `properties.${nestedPopupKey}`))) {
      _.set(popupSchema, `properties.${nestedPopupKey}`, componentSchema);
    }
  }
};

export const PagePopups = () => {
  const params = useParams();
  const popupParams = getPopupParamsFromPath(params['*']);
  const firstParams = popupParams[0];
  const { requestSchema } = useRequestSchema();
  const [rootSchema, setRootSchema] = useState<ISchema>(null);

  useEffect(() => {
    const run = async () => {
      const waitList = popupParams.map(
        (params) => getStoredPopupParams(params.popupUid)?.schema || requestSchema(params.popupUid),
      );
      const schemas = await Promise.all(waitList);
      const clonedSchemas = schemas.map((schema) => {
        const result = _.cloneDeep(_.omit(schema, 'parent'));
        result['x-read-pretty'] = true;
        return result;
      });
      const rootSchema = clonedSchemas[0];
      for (let i = 1; i < clonedSchemas.length; i++) {
        insertToPopupSchema(clonedSchemas[i], popupParams[i], clonedSchemas[i - 1]);
      }
      setRootSchema(rootSchema);
    };
    run();
  }, [popupParams, requestSchema]);

  const components = useMemo(() => ({ PagePopupsItemProvider }), []);

  if (!rootSchema) {
    return null;
  }

  return (
    <PagePopupsItemProvider params={firstParams}>
      <SchemaComponent components={components} schema={rootSchema} onlyRenderProperties />;
    </PagePopupsItemProvider>
  );
};

const useRequestSchema = () => {
  const api = useAPIClient();

  const requestSchema = useCallback(async (uid: string) => {
    const data = await api.request({
      url: `/uiSchemas:getJsonSchema/${uid}`,
    });
    return data.data?.data as ISchema;
  }, []);

  return { requestSchema };
};
