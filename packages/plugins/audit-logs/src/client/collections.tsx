import { useAuditLogsTranslation } from './locale';

export const useAuditLogsCollection = () => {
  return {
    name: 'auditLogs',
    title: '{{t("Audit logs")}}',
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
            ellipsis: true,
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
          'x-component-props': { ellipsis: true },
          'x-read-pretty': true,
          enum: [
            { label: '{{t("Create record")}}', value: 'create', color: 'lime' },
            { label: '{{t("Update record")}}', value: 'update', color: 'gold' },
            { label: '{{t("Delete record")}}', value: 'destroy', color: 'magenta' },
          ],
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
        collectionName: 'auditLogs',
        name: 'collection',
        type: 'belongsTo',
        interface: 'm2o',
        target: 'collections',
        targetKey: 'name',
        sourceKey: 'id',
        foreignKey: 'collectionName',
        uiSchema: {
          type: 'object',
          title: '{{t("Collection")}}',
          'x-component': 'AssociationField',
          'x-component-props': { fieldNames: { value: 'name', label: 'title' }, ellipsis: true },
          'x-read-pretty': true,
        },
      },
      {
        name: 'user',
        collectionName: 'auditLogs',
        type: 'belongsTo',
        interface: 'createdBy',
        targetKey: 'id',
        foreignKey: 'createdById',
        target: 'users',
        uiSchema: {
          type: 'object',
          title: '{{t("User")}}',
          'x-component': 'AssociationField',
          'x-component-props': { fieldNames: { value: 'id', label: 'nickname' }, ellipsis: true },
          'x-read-pretty': true,
        },
      },
      {
        name: 'changes',
        collectionName: 'auditLogs',
        type: 'hasMany',
        interface: 'subTable',
        target: 'auditChanges',
        foreignKey: 'auditLogId',
        targetKey: 'id',
        uiSchema: {
          type: 'object',
          title: '{{t("Details of changes", { ns: "audit-logs" })}}',
        },
      },
    ],
  };
};

export const useAuditChangesCollection = () => {
  return {
    name: 'auditChanges',
    title: '{{t("Audit Changes")}}',
    fields: [
      {
        name: 'field',
        type: 'json',
        interface: 'input',
        uiSchema: {
          title: '{{t("Field")}}',
          'x-component': 'AuditLogsField',
        },
      },
      {
        type: 'json',
        name: 'before',
        interface: 'input',
        uiSchema: {
          title: '{{t("Before change")}}',
          'x-component': 'AuditLogsValue',
        },
      },
      {
        type: 'json',
        name: 'after',
        interface: 'input',
        uiSchema: {
          title: '{{t("After change")}}',
          'x-component': 'AuditLogsValue',
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
