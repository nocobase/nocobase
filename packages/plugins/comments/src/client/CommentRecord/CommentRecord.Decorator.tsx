import { observer } from '@formily/react';
import {
  CollectionManagerContext,
  CollectionManagerProvider,
  TableBlockProvider,
  useCollection,
  useRecord,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { useCommentTranslation } from '../locale';
import { IsAssociationBlock } from './CommentRecord';

const useCommentsCollection = () => {
  const { t } = useCommentTranslation();

  return {
    name: 'comments',
    title: t('Comment Record'),
    fields: [
      {
        name: 'createdAt',
        type: 'date',
        interface: 'createdAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Created at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {
            showTime: true,
          },
        },
      },
      {
        name: 'recordId',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: '{{t("Record ID")}}',
        },
      },
      {
        name: 'recordTitle',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: t('Record title'),
        },
      },
      {
        name: 'collection',
        type: 'belongsTo',
        interface: 'obo',
        target: 'collections',
        uiSchema: {
          title: '{{t("Collection")}}',
        },
      },
      {
        name: 'createdBy',
        type: 'belongsTo',
        target: 'users',
        interface: 'createdBy',
        uiSchema: {
          title: t('Commenter'),
        },
      },
      {
        name: 'mentionUsers',
        type: 'belongsToMany',
        target: 'users',
        foreignKey: 'userId',
        otherKey: 'commentId',
        interface: 'updatedBy',
        uiSchema: {
          title: t('Ref users'),
        },
      },
    ],
  };
};

export const useCollectionsCollection = () => {
  const { t } = useCommentTranslation();

  return {
    name: 'collections',
    title: t('Collection name'),
    fields: [
      {
        name: 'name',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: t('Collection name'),
        },
      },
      {
        name: 'title',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: t('Collection title'),
        },
      },
    ],
  };
};

export const CommentRecordDecorator = observer((props: any) => {
  const parent = useCollection();
  const record = useRecord();
  const { collections, ...restCollectionManagerCtx } = useContext(CollectionManagerContext);
  const collectionsCollection = useCollectionsCollection();
  const commentsCollection = useCommentsCollection();

  let filter = props?.params?.filter;
  if (parent.name) {
    const filterByTk = record?.[parent.filterTargetKey || 'id'];
    if (filter) {
      filter = {
        $and: [
          filter,
          {
            collectionName: parent.name,
            recordId: `${filterByTk}`,
          },
        ],
      };
    } else {
      filter = {
        collectionName: parent.name,
        recordId: `${filterByTk}`,
      };
    }
  }
  const defaults = {
    collection: 'comments',
    resource: 'comments',
    action: 'list',
    params: {
      pageSize: 20,
      appends: ['collection', 'createdBy', 'mentionUsers'],
      ...props.params,
      filter,
      sort: '-createdAt',
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };
  return (
    <IsAssociationBlock.Provider value={!!parent.name}>
      <CollectionManagerProvider
        {...restCollectionManagerCtx}
        collections={[...collections, commentsCollection, collectionsCollection]}
      >
        <TableBlockProvider {...defaults}>{props.children}</TableBlockProvider>
      </CollectionManagerProvider>
    </IsAssociationBlock.Provider>
  );
});
