import { SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddNewQuery, EditQuery } from './AddNewQuery';
import { ConfigureFields } from './ConfigureFields';
import { chartsQueriesSchema, useDestroyQueryItemAction } from './schemas/chartsQueries';
import JSON5 from 'json5';

export const QueriesTable = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent scope={{ JSON5, useDestroyQueryItemAction }} schema={chartsQueriesSchema}
                       components={{ AddNewQuery, EditQuery, ConfigureFields }} />
    </Card>
  );
};
