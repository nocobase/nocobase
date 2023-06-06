import { TableOutlined } from '@ant-design/icons';
import { ISchema, useFieldSchema } from '@formily/react';
import {
  createTableBlockSchema,
  generateFilterParams,
  SchemaInitializer,
  useCollection,
  useRecord,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getResourceOfBlockDesigner } from './utils';

export const AuditLogsBlockInitializer = (props) => {
  const { filterTargetKey } = useCollection();

  const { insert } = props;
  const { t } = useTranslation();
  const record = useRecord();
  const fieldSchema = useFieldSchema();

  const crypticFilterFromAuditLogs = generateFilterParams(
    record,
    getResourceOfBlockDesigner(fieldSchema),
    filterTargetKey,
    {},
  );
  const schema = createTableBlockSchema({
    collection: 'auditLogs',
    rowKey: 'id',
    tableActionInitializers: 'AuditLogsTableActionInitializers',
    tableColumnInitializers: 'AuditLogsTableColumnInitializers',
    tableActionColumnInitializers: 'AuditLogsTableActionColumnInitializers',
    tableBlockProvider: 'AuditLogsBlockProvider',
    disableTemplate: true,
    // 当前filter 不需要在 "设置数据范围" 表单里初始化，只需要在查询的时候合并到查询条件 filter中
    crypticFilter: crypticFilterFromAuditLogs,
  });

  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert(schema as ISchema);
      }}
      title={t('Audit Logs')}
    />
  );
};
