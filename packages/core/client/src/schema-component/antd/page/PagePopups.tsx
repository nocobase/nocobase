/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema } from '@formily/json-schema';
import { useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import _ from 'lodash';
import { FC, default as React, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { useAPIClient } from '../../../api-client';
import { AppNotFound } from '../../../common/AppNotFound';
import { DataBlockProvider } from '../../../data-source/data-block/DataBlockProvider';
import { BlockRequestContextProvider } from '../../../data-source/data-block/DataBlockRequestProvider';
import { useKeepAlive } from '../../../route-switch/antd/admin-layout/KeepAlive';
import { SchemaComponent } from '../../core';
import { TabsContextProvider } from '../tabs/context';
import { usePopupSettings } from './PopupSettingsProvider';
import { deleteRandomNestedSchemaKey, getRandomNestedSchemaKey } from './nestedSchemaKeyStorage';
import {
  PopupParams,
  getBlockService,
  getPopupParamsFromPath,
  getStoredPopupContext,
  usePopupUtils,
} from './pagePopupUtils';
import { removePopupLayerState } from './popupState';
import {
  PopupContext,
  getPopupContextFromActionOrAssociationFieldSchema,
} from './usePopupContextInActionOrAssociationField';

interface PopupsVisibleProviderProps {
  visible: boolean;
  setVisible?: (value: boolean) => void;
}

export interface PopupProps {
  params: PopupParams;
  context: PopupContext;
  /**
   * When set to true, the current popup will be hidden.
   */
  hidden: boolean;
  /**
   * Used to identify the level of the current popup, where 1 represents the first level.
   */
  currentLevel: number;
  /**
   * Whether the current popup is a subpage.
   */
  isSubPage?: boolean;
}

export const PopupVisibleProviderContext = React.createContext<PopupsVisibleProviderProps>(null);
export const PopupParamsProviderContext = React.createContext<Omit<PopupProps, 'hidden'>>(null);

// Provides the context information for all levels of popups.
export const AllPopupsPropsProviderContext = React.createContext<PopupProps[]>(null);

PopupVisibleProviderContext.displayName = 'PopupVisibleProviderContext';
PopupParamsProviderContext.displayName = 'PopupParamsProviderContext';
AllPopupsPropsProviderContext.displayName = 'AllPopupsPropsProviderContext';

/**
 * The difference between this component and ActionContextProvider is that
 * this component is only used to control the popups in the PagePopupsItem component (excluding the nested popups within it).
 * @param param0
 * @returns
 */
export const PopupVisibleProvider: FC<PopupsVisibleProviderProps> = React.memo(({ children, visible, setVisible }) => {
  const value = useMemo(() => {
    return { visible, setVisible };
  }, [visible, setVisible]);

  return <PopupVisibleProviderContext.Provider value={value}>{children}</PopupVisibleProviderContext.Provider>;
});

PopupVisibleProvider.displayName = 'PopupVisibleProvider';

const VisibleProvider: FC<{ popupuid: string }> = React.memo(({ children, popupuid }) => {
  const { closePopup } = usePopupUtils();
  const [visible, _setVisible] = useState(true);
  const setVisible = useCallback(
    (visible: boolean) => {
      if (!visible) {
        _setVisible(false);

        if (process.env.__E2E__) {
          setTimeout(() => {
            closePopup();
            // Deleting here ensures that the next time the same popup is opened, it will generate another random key.
            deleteRandomNestedSchemaKey(popupuid);
          });
          return;
        }

        // Leave some time to refresh the block data
        setTimeout(() => {
          closePopup();
          // Deleting here ensures that the next time the same popup is opened, it will generate another random key.
          deleteRandomNestedSchemaKey(popupuid);
        }, 300);
      }
    },
    [closePopup, popupuid],
  );

  return (
    <PopupVisibleProvider visible={visible} setVisible={setVisible}>
      {children}
    </PopupVisibleProvider>
  );
});

const PopupParamsProvider: FC<Omit<PopupProps, 'hidden'>> = (props) => {
  const value = useMemo(() => {
    return {
      params: props.params,
      context: props.context,
      currentLevel: props.currentLevel,
    };
  }, [props.params, props.context, props.currentLevel]);
  return <PopupParamsProviderContext.Provider value={value}>{props.children}</PopupParamsProviderContext.Provider>;
};

const PopupTabsPropsProvider: FC = ({ children }) => {
  const { params } = useCurrentPopupContext();
  const { changeTab } = usePopupUtils();
  const onChange = useCallback(
    (key: string) => {
      changeTab(key);
    },
    [changeTab],
  );
  const { isPopupVisibleControlledByURL } = usePopupSettings();

  if (!isPopupVisibleControlledByURL()) {
    return <>{children}</>;
  }

  return (
    <TabsContextProvider activeKey={params?.tab} onChange={onChange}>
      {children}
    </TabsContextProvider>
  );
};

const displayNone = { display: 'none' };
const PagePopupsItemProvider: FC<{
  params: PopupParams;
  context: PopupContext;
  /**
   * Used to identify the level of the current popup, where 1 represents the first level.
   */
  currentLevel: number;
}> = ({ params, context, currentLevel, children }) => {
  const storedContext = { ...getStoredPopupContext(params.popupuid) };

  useEffect(() => {
    return () => {
      removePopupLayerState(currentLevel);
    };
  }, [currentLevel]);

  if (!context) {
    context = _.omitBy(
      {
        dataSource: storedContext.dataSource,
        collection: storedContext.collection,
        association: storedContext.association,
      },
      _.isNil,
    ) as PopupContext;
  }

  if (_.isEmpty(context)) {
    return (
      <PopupParamsProvider params={params} context={context} currentLevel={currentLevel}>
        <PopupTabsPropsProvider>
          <VisibleProvider popupuid={params.popupuid}>
            <div style={displayNone}>{children}</div>
          </VisibleProvider>
        </PopupTabsPropsProvider>
      </PopupParamsProvider>
    );
  }

  return (
    <PopupParamsProvider params={params} context={context} currentLevel={currentLevel}>
      <DataBlockProvider
        dataSource={context.dataSource}
        collection={params.collection || context.collection}
        association={context.association}
        sourceId={params.sourceid}
        filterByTk={parseQueryString(params.filterbytk)}
        // @ts-ignore
        record={storedContext.record}
        parentRecord={storedContext.parentRecord}
        action="get"
      >
        {/* Pass the service of the block where the button is located down, to refresh the block's data when the popup is closed */}
        <BlockRequestContextProvider recordRequest={storedContext.service}>
          <PopupTabsPropsProvider>
            <VisibleProvider popupuid={params.popupuid}>
              <div style={displayNone}>{children}</div>
            </VisibleProvider>
          </PopupTabsPropsProvider>
        </BlockRequestContextProvider>
      </DataBlockProvider>
    </PopupParamsProvider>
  );
};

/**
 * insert childSchema to parentSchema to render the nested popups
 * @param childSchema
 * @param props
 * @param parentSchema
 */
export const insertChildToParentSchema = ({
  childSchema,
  props,
  parentSchema,
  getPopupSchema = (currentSchema) => _.get(currentSchema.properties, Object.keys(currentSchema.properties)[0]),
}: {
  childSchema: ISchema;
  props: PopupProps;
  parentSchema: ISchema;
  getPopupSchema?: (currentSchema: ISchema) => ISchema;
}) => {
  const { params, context, currentLevel } = props;

  const componentSchema = {
    type: 'void',
    'x-component': 'PagePopupsItemProvider',
    'x-component-props': {
      params,
      context,
      currentLevel,
    },
    properties: {
      popupAction: childSchema,
    },
  };

  // If we don't use a random name, it will cause the component's parameters not to be updated when reopening the popup
  const nestedPopupKey = getRandomNestedSchemaKey(params.popupuid);

  if (parentSchema.properties) {
    const popupSchema = getPopupSchema(parentSchema);
    if (_.isEmpty(_.get(popupSchema, `properties.${nestedPopupKey}`))) {
      _.set(popupSchema, `properties.${nestedPopupKey}`, componentSchema);
    }
  }
};

const InternalPagePopups = (props: { paramsList?: PopupParams[] }) => {
  const fieldSchema = useFieldSchema();
  const location = useLocation();
  const popupParams = props.paramsList || getPopupParamsFromPath(getPopupPath(location));
  const { requestSchema } = useRequestSchema();
  const [rootSchema, setRootSchema] = useState<ISchema>(null);
  const popupPropsRef = useRef<PopupProps[]>([]);
  const { savePopupSchemaToSchema, getPopupSchemaFromSchema } = usePopupUtils();

  useEffect(() => {
    const run = async () => {
      const waitList = popupParams.map((params) => {
        return (
          getStoredPopupContext(params.popupuid)?.schema ||
          findSchemaByUid(params.popupuid, fieldSchema?.root) ||
          requestSchema(params.popupuid)
        );
      });
      const schemas = await Promise.all(waitList);
      const clonedSchemas = await Promise.all(
        schemas.map(async (schema, index) => {
          if (_.isEmpty(schema)) {
            return get404Schema();
          }

          const params = popupParams[index];

          if (params.puid) {
            const popupSchema = findSchemaByUid(params.puid, fieldSchema?.root);
            if (popupSchema) {
              savePopupSchemaToSchema(_.omit(popupSchema, 'parent'), schema);
            } else {
              // 当本地找不到 popupSchema 时，通过接口请求 puid 对应的 schema
              try {
                const remoteSchema = await requestSchema(params.puid);
                if (remoteSchema) {
                  savePopupSchemaToSchema(remoteSchema, schema);
                }
              } catch (error) {
                console.error('Failed to fetch schema for puid:', params.puid, error);
              }
            }
          }

          // Using toJSON for deep clone, faster than lodash's cloneDeep
          const result = _.cloneDeepWith(_.omit(schema, 'parent'), (value) => {
            // If we clone the Tabs component, it will cause the configuration to be lost when reopening the popup after modifying its settings
            if (value?.['x-component'] === 'Tabs') {
              return value;
            }
          });
          result['x-read-pretty'] = true;

          return result;
        }),
      );
      popupPropsRef.current = clonedSchemas.map((schema, index, items) => {
        const schemaContext = getPopupContextFromActionOrAssociationFieldSchema(schema);
        let hidden = false;

        for (let i = index + 1; i < items.length; i++) {
          if (isSubPageSchema(items[i])) {
            // Because the popup has a higher z-index, if the popup is not hidden, there will be an issue where the subpage is displayed below the popup.
            hidden = true;
            break;
          }
        }

        return {
          params: popupParams[index],
          context: schemaContext,
          hidden,
          currentLevel: index + 1,
          isSubPage: isSubPageSchema(schema),
        };
      });

      const rootSchema = clonedSchemas[0];

      for (let i = 1; i < clonedSchemas.length; i++) {
        insertChildToParentSchema({
          childSchema: clonedSchemas[i],
          props: popupPropsRef.current[i],
          parentSchema: clonedSchemas[i - 1],
          getPopupSchema: (currentSchema) => {
            return (
              getPopupSchemaFromSchema(currentSchema) ||
              _.get(currentSchema.properties, Object.keys(currentSchema.properties)[0])
            );
          },
        });
      }

      setRootSchema(rootSchema);
    };
    run();
  }, [fieldSchema, getPopupSchemaFromSchema, popupParams, requestSchema, savePopupSchemaToSchema]);

  const components = useMemo(() => ({ PagePopupsItemProvider }), []);

  if (!rootSchema) {
    return null;
  }

  return (
    <AllPopupsPropsProviderContext.Provider value={popupPropsRef.current}>
      <PagePopupsItemProvider
        params={popupPropsRef.current[0].params}
        context={popupPropsRef.current[0].context}
        currentLevel={1}
      >
        <SchemaComponent components={components} schema={rootSchema} onlyRenderProperties />
      </PagePopupsItemProvider>
    </AllPopupsPropsProviderContext.Provider>
  );
};

export const PagePopups = (props: { paramsList?: PopupParams[] }) => {
  const { active } = useKeepAlive();

  if (!active) {
    return null;
  }

  return <InternalPagePopups {...props} />;
};

export const useRequestSchema = () => {
  const api = useAPIClient();

  const requestSchema = useCallback(async (uid: string) => {
    try {
      const data = await api.request({
        url: `/uiSchemas:getJsonSchema/${uid}`,
      });
      return data.data?.data as ISchema;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  return { requestSchema };
};

/**
 * The reason why we don't use the decoded data returned by useParams here is because we need the raw values.
 * @param location
 * @returns
 */
export const getPopupPath = (location: Location) => {
  const [, ...popupsPath] = location.pathname.split('/popups/');
  return popupsPath.join('/popups/');
};

function isSubPageSchema(schema: ISchema) {
  const openMode = _.get(schema, 'x-component-props.openMode');
  return openMode === 'page';
}

export const useCurrentPopupContext = (): PopupProps => {
  const { currentLevel } = React.useContext(PopupParamsProviderContext) || ({} as Omit<PopupProps, 'hidden'>);
  const allPopupsProps = React.useContext(AllPopupsPropsProviderContext);
  const result = allPopupsProps?.[currentLevel - 1] || ({} as PopupProps);

  if (result.context) {
    Object.setPrototypeOf(result.context, {
      get blockService() {
        if (result?.params?.popupuid) {
          return getBlockService(result.params.popupuid)?.service;
        }
        return null;
      },
    });
  } else {
    result.context = {
      get blockService() {
        if (result?.params?.popupuid) {
          return getBlockService(result.params.popupuid)?.service;
        }
        return null;
      },
    };
  }

  return result;
};

/**
 * Used to display a message to the user indicating that the popup schema has been deleted
 */
function get404Schema() {
  return {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    title: '{{ t("Error message") }}',
    'x-action': 'view',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:view',
    'x-component': 'Action.Link',
    'x-component-props': {
      openMode: 'drawer',
    },
    'x-action-context': {},
    'x-decorator': 'ACLActionProvider',
    'x-designer-props': {
      linkageAction: true,
    },
    properties: {
      drawer: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        title: 'Error message',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
          level: 99, // 确保在最上层
        },
        properties: {
          tabs: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            'x-initializer': 'popup:addTab',
            properties: {
              tab1: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                title: '404',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': function Com() {
                      return <AppNotFound />;
                    },
                    'x-uid': uid(),
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': uid(),
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': uid(),
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': uid(),
        'x-async': false,
        'x-index': 1,
      },
    },
    name: uid(),
    'x-uid': uid(),
    'x-async': false,
    'x-index': 2,
    'x-read-pretty': true,
  };
}

function findSchemaByUid(uid: string, rootSchema: Schema, resultRef: { value: Schema } = { value: null }) {
  resultRef = resultRef || {
    value: null,
  };
  rootSchema?.mapProperties?.((schema) => {
    if (schema['x-uid'] === uid) {
      resultRef.value = schema;
    } else {
      findSchemaByUid(uid, schema, resultRef);
    }
  });
  return resultRef.value;
}

function parseQueryString(queryString) {
  // 如果没有 '&'，直接返回原始字符串
  if (!queryString?.includes?.('=')) {
    return queryString;
  }

  // 解码查询字符串
  const decodedString = decodeURIComponent(queryString);

  // 将解码后的字符串按 '&' 分隔成键值对
  const pairs = decodedString.split('&');

  // 将键值对转换为对象
  const params = pairs.reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    acc[key] = value;
    return acc;
  }, {});

  return params;
}
