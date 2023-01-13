import { observer } from '@formily/react';
import {
  CollectionManagerContext,
  CollectionManagerProvider,
  TableBlockProvider,
  useCollection,
  useRecord,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { IsAssociationBlock } from './CommentRecord';

// export const collection = {
//   name: 'auditLogs',
//   title: '{{t("Audit logs")}}',
//   fields: [
//     {
//       name: 'createdAt',
//       type: 'date',
//       interface: 'createdAt',
//       uiSchema: {
//         type: 'datetime',
//         title: '{{t("Created at")}}',
//         'x-component': 'DatePicker',
//         'x-component-props': {
//           showTime: true,
//         },
//         'x-read-pretty': true,
//       },
//     },
//     {
//       name: 'type',
//       type: 'string',
//       interface: 'select',
//       uiSchema: {
//         type: 'string',
//         title: '{{t("Action type")}}',
//         'x-component': 'Select',
//         'x-read-pretty': true,
//         enum: [
//           { label: '{{t("Create record")}}', value: 'create', color: 'lime' },
//           { label: '{{t("Update record")}}', value: 'update', color: 'gold' },
//           { label: '{{t("Delete record")}}', value: 'destroy', color: 'magenta' },
//         ],
//       },
//     },
//   ],
// };

export const collection2 = {
  name: 'comments',
  title: '{{t("Comment Record")}}',
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
      name: 'type',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '{{t("Action type")}}',
        'x-component': 'Select',
        'x-read-pretty': true,
        enum: [
          { label: '{{t("Create record")}}', value: 'create', color: 'lime' },
          { label: '{{t("Update record")}}', value: 'update', color: 'gold' },
          { label: '{{t("Delete record")}}', value: 'destroy', color: 'magenta' },
        ],
      },
    },
  ],
};

export const CommentRecordDecorator = observer((props: any) => {
  const parent = useCollection();
  const record = useRecord();
  const { interfaces } = useContext(CollectionManagerContext);
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
      <CollectionManagerProvider collections={[collection2]} interfaces={interfaces}>
        <TableBlockProvider {...defaults}>{props.children}</TableBlockProvider>
      </CollectionManagerProvider>
    </IsAssociationBlock.Provider>
  );
});
