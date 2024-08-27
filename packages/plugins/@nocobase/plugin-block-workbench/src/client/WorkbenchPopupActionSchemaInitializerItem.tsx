/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ButtonEditor,
  SchemaSettings,
  SchemaSettingOpenModeSchemaItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useOpenModeContext,
  usePopupUtils,
  usePopupSettings,
  ActionContext,
  storePopupContext,
  useCollectionManager,
  useNavigateNoUpdate,
  getPopupPathFromParams,
  withSearchParams,
  useDataBlockRequest,
  CollectionRecord,
  useDataSourceKey,
  useCollectionParentRecord,
  useCollection,
  usePopupContextInActionOrAssociationField,
} from '@nocobase/client';
import { uid } from '@nocobase/utils';
import { last } from 'lodash';
import React, { useContext, useCallback } from 'react';
import { useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { ModalActionSchemaInitializerItem } from './ModalActionSchemaInitializerItem';

export const workbenchActionSettingsPopup = new SchemaSettings({
  name: 'workbench:actionSettings:popup',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        return { hasIconColor: true };
      },
    },

    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      useComponentProps() {
        const { hideOpenMode } = useOpenModeContext();
        return {
          openMode: !hideOpenMode,
          openSize: !hideOpenMode,
        };
      },
    },
    {
      sort: 800,
      name: 'd1',
      type: 'divider',
    },
    {
      sort: 900,
      type: 'remove',
      name: 'remove',
    },
  ],
});

export function WorkbenchPopupActionSchemaInitializerItem(props) {
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getPopupContext } = usePopupUtils();
  return (
    <ModalActionSchemaInitializerItem
      title={t('Popup', { ns: 'block-workbench' })}
      modalSchema={{
        title: t('Add popup'),
        properties: {
          title: {
            title: t('Title'),
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          icon: {
            title: t('Icon'),
            required: true,
            'x-component': 'IconPicker',
            'x-decorator': 'FormItem',
          },
          iconColor: {
            title: t('Color'),
            required: true,
            default: '#1677FF',
            'x-component': 'ColorPicker',
            'x-decorator': 'FormItem',
          },
          openMode: {
            title: t('openMode'),
            required: false,
            default: 'drawer',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              { label: t('Drawer'), value: 'drawer' },
              { label: t('Dialog'), value: 'modal' },
              { label: t('Page'), value: 'page' },
            ],
          },
        },
      }}
      onSubmit={(values) => {
        console.log(values);
        insert({
          type: 'void',
          title: values.title,
          'x-action': 'workbench:customize:popup',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-settings': 'workbench:actionSettings:popup',
          'x-component': 'WorkbenchAction',
          'x-use-component-props': 'usePopupActionProps',
          'x-component-props': {
            icon: values.icon,
            iconColor: values.iconColor,
            openMode: values.openMode,
            refreshDataBlockRequest: false,
          },
          properties: {
            drawer: {
              type: 'void',
              title: values.title,
              'x-component': 'Action.Container',
              'x-component-props': {
                className: 'nb-action-popup',
              },
              properties: {
                tabs: {
                  type: 'void',
                  'x-component': 'Tabs',
                  'x-component-props': {},
                  'x-initializer': 'popup:addTab',
                  properties: {
                    tab1: {
                      type: 'void',
                      title: '{{t("Details")}}',
                      'x-component': 'Tabs.TabPane',
                      'x-designer': 'Tabs.Designer',
                      'x-component-props': {},
                      properties: {
                        grid: {
                          type: 'void',
                          'x-component': 'Grid',
                          'x-initializer': 'page:addBlock',
                          properties: {},
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          //   [CONTEXT_SCHEMA_KEY]: getPopupContext(),
        });
      }}
    />
  );
}

export const usePopupActionProps = () => {
  const navigate = useNavigateNoUpdate();
  const fieldSchema = useFieldSchema();
  const componentPropsValue = fieldSchema?.['x-component-props'];
  const { t } = useTranslation();
  const currentPopupUidWithoutOpened = fieldSchema?.['x-uid'];
  const service = useDataBlockRequest();
  const collection = useCollection();

  const dataSourceKey = useDataSourceKey();
  const parentRecord = useCollectionParentRecord();

  const cm = useCollectionManager();
  const { setVisible: setVisibleFromAction } = useContext(ActionContext);
  const { updatePopupContext } = usePopupContextInActionOrAssociationField();

  const { isPopupVisibleControlledByURL } = usePopupSettings();

  const getNewPathname = useCallback(
    ({
      tabKey,
      popupUid,
      recordData,
      sourceId,
      collection: _collection,
      puid,
    }: {
      /**
       * this is the schema uid of the button that triggers the popup, while puid is the schema uid of the popup, they are different;
       */
      popupUid: string;
      recordData: Record<string, any>;
      sourceId: string;
      tabKey?: string;
      collection?: string;
      /** popup uid */
      puid?: string;
    }) => {
      const filterByTK = uid();
      return getPopupPathFromParams({
        popupuid: popupUid,
        puid,
        collection: _collection,
        filterbytk: filterByTK,
        sourceid: sourceId,
        tab: tabKey,
      });
    },
    [],
  );

  // return {
  //   type: 'default',
  //   async onClick({
  //     recordData,
  //     parentRecordData,
  //     collectionNameUsedInURL,
  //     popupUidUsedInURL,
  //   }: {
  //     recordData?: Record<string, any>;
  //     parentRecordData?: Record<string, any>;
  //     /** if this value exists, it will be saved in the URL */
  //     collectionNameUsedInURL?: string;
  //     /** if this value exists, it will be saved in the URL */
  //     popupUidUsedInURL?: string;
  //   } = {}) {
  //     if (!isPopupVisibleControlledByURL()) {
  //       return setVisibleFromAction?.(true);
  //     }

  //     recordData = recordData;
  //     const pathname = getNewPathname({
  //       popupUid: currentPopupUidWithoutOpened,
  //       recordData,
  //       sourceId: null,
  //       collection: collectionNameUsedInURL,
  //       puid: popupUidUsedInURL,
  //     });
  //     let url = location.pathname;
  //     if (last(url) === '/') {
  //       url = url.slice(0, -1);
  //     }

  //     storePopupContext(currentPopupUidWithoutOpened, {
  //       schema: fieldSchema,
  //       record: new CollectionRecord({ isNew: false, data: recordData }),
  //       parentRecord: parentRecordData ? new CollectionRecord({ isNew: false, data: parentRecordData }) : parentRecord,
  //       service,
  //       dataSource: dataSourceKey,
  //       collection: collection.name,
  //       association: null,
  //       sourceId: null,
  //     });

  //     updatePopupContext({
  //       dataSource: dataSourceKey,
  //       collection: collection.name,
  //     });
  //     console.log(pathname);
  //     console.log(url);
  //     console.log(withSearchParams(`${url}${pathname}`));
  //     navigate(withSearchParams(`${url}${pathname}`));
  //   },
  // };
};
