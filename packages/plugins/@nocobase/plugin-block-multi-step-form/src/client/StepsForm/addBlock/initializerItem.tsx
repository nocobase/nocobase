import { FormOutlined } from '@ant-design/icons';
import {
  SchemaInitializerItemType,
  useCollection,
  useSchemaInitializer,
  useCollectionManager,
  useCollectionField,
} from '@nocobase/client';
import React from 'react';
import { ComponentType } from '../../constants';
import { useT } from '../../locale';
import { getStepsFormSchema } from './blockSchema';

export const stepsFormInitializerItemCreater: (
  from: 'page' | 'popup' | 'addNew',
  formType: 'create' | 'update',
) => SchemaInitializerItemType = (from, formType) => {
  return {
    name: ComponentType,
    Component: 'DataBlockInitializer',
    useComponentProps() {
      const { insert } = useSchemaInitializer();
      const t = useT();
      const currentCollection = useCollection();
      const cm = useCollectionManager();
      const field = useCollectionField();

      const itemConfig = {
        icon: <FormOutlined />,
        componentType: ComponentType,
        collectionName: currentCollection?.name,
        dataSource: currentCollection?.dataSource,
      };

      // 弹窗编辑
      if (from === 'popup' && formType === 'update') {
        const collectionsNeedToDisplay = [currentCollection];
        return {
          ...itemConfig,
          title: t('StepsForm(Edit)'),
          filter({ collection }) {
            if (collection) {
              return collectionsNeedToDisplay.some((c) => c.name === collection.name);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          hideSearch: true,
          hideOtherRecordsInPopup: true,
          // componentType: `FormItem`,
          onCreateBlockSchema: ({ item, fromOthersInPopup }) => {
            const association = field ? `${field.collectionName}.${field.name}` : null;
            insert(
              getStepsFormSchema({
                association,
                dataSource: item.dataSource,
                collection: item.collectionName || item.name,
                isEdit: true, // TODO 点击 currenRecord 时 collectionName 存在，需是否存在其他可能
                stepTitle: t('Step') + ' 1',
                isCurrent: !!association,
              }),
            );
          },
          // templateWrap: () => {},
          showAssociationFields: true,
        };
      }

      // 弹窗创建
      if (from === 'popup' && formType === 'create') {
        return {
          ...itemConfig,
          title: t('StepsForm(Add new)'),
          filter: ({ collection, associationField }) => {
            if (!currentCollection) {
              return true;
            }
            // 关联表
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          hideSearch: true,
          // componentType: `FormItem`,
          onCreateBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              insert(
                getStepsFormSchema({
                  dataSource: item.dataSource,
                  collection: item.collectionName || item.name,
                  isEdit: false,
                  stepTitle: t('Step') + ' 1',
                  isCusomeizeCreate: true,
                }),
              );
            } else {
              const field = item.associationField;
              const collection = cm.getCollection(field.target);
              insert(
                getStepsFormSchema({
                  dataSource: collection.dataSource,
                  // collection: item.collectionName || item.name,
                  association: `${field.collectionName}.${field.name}`,
                  isEdit: false,
                  stepTitle: t('Step') + ' 1',
                  isCusomeizeCreate: true,
                }),
              );
            }
          },
          templateWrap: (templateSchema, { item, fromOthersInPopup }) => {
            // if (fromOthersInPopup) {
            //   return templateWrapCollection(templateSchema, { item, fromOthersInPopup });
            // }
            // return templateWrap(templateSchema, { item });
            return templateSchema;
          },
          showAssociationFields: true,
        };
      }

      // 弹窗编辑-添加子节点
      if (from === 'addNew') {
        return {
          ...itemConfig,
          title: t('StepsForm'),
          onlyCurrentDataSource: true,
          hideSearch: true,
          collectionName: currentCollection.name,
          dataSource: currentCollection.dataSource,
          currentText: t('Current collection'),
          otherText: t('Other collections'),
          showAssociationFields: true,
          filter: ({ collection, associationField }) => {
            if (associationField) {
              return false;
            }
            if (collection.name === currentCollection.name) {
              return true;
            }
          },
          onCreateBlockSchema: ({ item }) => {
            insert(
              getStepsFormSchema({
                dataSource: item.dataSource,
                collection: item.collectionName || item.name,
                isEdit: false, // TODO 点击 currenRecord 时 collectionName 存在，需是否存在其他可能
                stepTitle: t('Step') + ' 1',
                isCusomeizeCreate: true,
              }),
            );
          },
          templateWrap: (templateSchema) => {
            return templateSchema;
          },
        };
      }

      // 普通页面
      return {
        ...itemConfig,
        title: t('StepsForm'),
        hideSearch: false,
        showAssociationFields: currentCollection ? true : false,
        onCreateBlockSchema({ item }) {
          insert(
            getStepsFormSchema({
              dataSource: item.dataSource,
              collection: item.collectionName || item.name,
              isEdit: false,
              stepTitle: t('Step') + ' 1',
              isCusomeizeCreate: true,
            }),
          );
        },
        filter: ({ collection, associationField }) => {
          if (!currentCollection) {
            return true;
          }
          // 创建编辑页
          if (collection && currentCollection) {
            return [currentCollection].some((c) => c.name === collection.name);
          }
          // 关联表
          if (associationField) {
            return true;
          }
          return false;
        },
        templateWrap: (templateSchema, { item }) => {
          // if (item.associationField) {
          //   if (['hasOne', 'belongsTo'].includes(item.associationField.type)) {
          //     return templateWrapOfAssociationDetailsWithoutPagination(templateSchema, { item });
          //   }
          //   return templateSchema;
          // }
          // return templateWrap(templateSchema, { item });
          return templateSchema;
        },
      };
    },
  };
};
