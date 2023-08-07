import React from 'react';
import { useTranslation } from 'react-i18next';
import { gridRowColWrap } from '../utils';
import { SchemaInitializer, useCollection, useCollectionManager } from '../..';
import { getFormCollections } from './RecordBlockInitializers';

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
                  component: 'RecordFormBlockInitializer',
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
