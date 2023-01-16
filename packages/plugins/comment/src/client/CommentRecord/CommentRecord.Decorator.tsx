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
          'x-read-pretty': true,
        },
      },
      {
        name: 'collectionName',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: 'Collection name',
          type: 'string',
          'x-component': 'Input',
          required: true,
        },
      },
    ],
  };
};

export const CommentRecordDecorator = observer((props: any) => {
  const parent = useCollection();
  const record = useRecord();
  const { interfaces } = useContext(CollectionManagerContext);
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
      appends: ['commenter', 'commentUsers'],
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
      <CollectionManagerProvider collections={[commentsCollection]} interfaces={interfaces}>
        <TableBlockProvider {...defaults}>{props.children}</TableBlockProvider>
      </CollectionManagerProvider>
    </IsAssociationBlock.Provider>
  );
});
