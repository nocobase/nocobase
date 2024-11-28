/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddNewQuery, EditQuery } from './AddNewQuery';
import { ConfigureFields } from './ConfigureFields';
import {
  chartsQueriesSchema,
  useDestroyAllSelectedQueriesAction,
  useDestroyQueryItemAction,
} from './schemas/chartsQueries';
import JSON5 from 'json5';

export const QueriesTable = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent
        scope={{ JSON5, useDestroyQueryItemAction, useDestroyAllSelectedQueriesAction }}
        schema={chartsQueriesSchema}
        components={{ AddNewQuery, EditQuery, ConfigureFields }}
      />
    </Card>
  );
};
