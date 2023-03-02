import { useCommentTranslation } from '../locale';

export const useCommentsCollection = () => {
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
        name: 'content',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: t('Comment content'),
          type: 'string',
          'x-component': 'CommentRecordContent',
          'x-component-props': { ellipsis: true },
        },
      },
      {
        name: 'recordId',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: '{{t("Record ID")}}',
          type: 'string',
          'x-component': 'Input',
          'x-component-props': { ellipsis: true },
        },
      },
      {
        name: 'recordTitle',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: t('Record title'),
          type: 'string',
          'x-component': 'Input',
          'x-component-props': { ellipsis: true },
        },
      },
      {
        name: 'collection',
        type: 'belongsTo',
        interface: 'm2o',
        target: 'collections',
        targetKey: 'name',
        uiSchema: {
          type: 'object',
          title: '{{t("Collection")}}',
          'x-component': 'RecordPicker',
          'x-component-props': { fieldNames: { value: 'name', label: 'title' }, ellipsis: true },
          'x-read-pretty': true,
        },
      },
      {
        name: 'createdBy',
        type: 'belongsTo',
        target: 'users',
        interface: 'createdBy',
        collectionName: 'comments',
        targetKey: 'id',
        foreignKey: 'userId',
        uiSchema: {
          type: 'object',
          title: t('Commenter'),
          'x-component': 'RecordPicker',
          'x-component-props': { fieldNames: { value: 'id', label: 'nickname' }, ellipsis: true },
          'x-read-pretty': true,
        },
      },
      {
        collectionName: 'comments',
        name: 'mentionUsers',
        type: 'belongsToMany',
        target: 'users',
        foreignKey: 'userId',
        otherKey: 'commentId',
        interface: 'linkTo',
        uiSchema: {
          type: 'object',
          title: t('Ref users'),
          'x-component': 'RecordPicker',
          'x-component-props': { fieldNames: { value: 'id', label: 'nickname' }, ellipsis: true },
          'x-read-pretty': true,
        },
      },
    ],
  };
};

export const useCollectionsCollection = () => {
  return {
    name: 'collections',
    title: '{{t("Collections")}}',
    fields: [
      {
        name: 'name',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: '{{t("Collection name")}}',
          type: 'string',
          'x-component': 'Input',
          'x-component-props': { ellipsis: true },
        },
      },
      {
        name: 'title',
        type: 'string',
        interface: 'input',
        uiSchema: {
          title: '{{t("Collection display name")}}',
          type: 'string',
          'x-component': 'Input',
          'x-component-props': { ellipsis: true },
        },
      },
    ],
  };
};
