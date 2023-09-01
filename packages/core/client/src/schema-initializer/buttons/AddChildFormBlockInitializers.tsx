import React from 'react';
import { useTranslation } from 'react-i18next';
import { gridRowColWrap } from '../utils';
import { SchemaInitializer, SchemaInitializerItemOptions, useCollection, useCollectionManager } from '../..';

const getFormCollections = (props) => {
  const { actionInitializers, childrenCollections, collection } = props;
  const formCollections = [
    {
      key: collection.name,
      type: 'item',
      title: collection?.title || collection.name,
      component: 'CreateFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    childrenCollections.map((c) => {
      return {
        key: c.name,
        type: 'item',
        title: c?.title || c.name,
        component: 'CreateFormBlockInitializer',
        icon: false,
        targetCollection: c,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemOptions[];

  return formCollections;
};
export const AddChildFormBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  const { getChildrenCollections } = useCollectionManager();
  const collection = useCollection();
  const formChildrenCollections = getChildrenCollections(collection.name);
  const hasFormChildCollection = formChildrenCollections?.length > 0;
  const modifyFlag = (collection as any).template !== 'view' || collection?.writableView;
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      title={component ? null : t('Add block')}
      icon={'PlusOutlined'}
      insertPosition={insertPosition}
      component={component}
      items={[
        {
          type: 'itemGroup',
          title: '{{t("Current record blocks")}}',
          children: [
            hasFormChildCollection
              ? {
                  key: 'form',
                  type: 'subMenu',
                  title: '{{t("Form")}}',
                  children: getFormCollections({
                    ...props,
                    childrenCollections: formChildrenCollections,
                    collection,
                  }),
                }
              : modifyFlag && {
                  key: 'form',
                  type: 'item',
                  title: '{{t("Form")}}',
                  component: 'CreateFormBlockInitializer',
                },
          ],
        },
        {
          type: 'itemGroup',
          title: '{{t("Other blocks")}}',
          children: [
            {
              type: 'item',
              title: '{{t("Markdown")}}',
              component: 'MarkdownBlockInitializer',
            },
          ],
        },
      ]}
    />
  );
};
