/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import {
  FormItem,
  Input,
  Space,
  useDataSourceManager,
  useDataSourceKey,
  useCollectionDataSourceItems,
} from '@nocobase/client';
import { Radio } from 'antd';
import { ArrayField as ArrayFieldModel, VoidField } from '@formily/core';
import { ArrayField, Field, useField, observer } from '@formily/react';
import { useNotificationTranslation } from '../../../../locale';

export const CollectionForm = () => {
  const { t } = useNotificationTranslation();
  const dm = useDataSourceManager();
  const dataSourceKey = useDataSourceKey();
  const allCollections = dm.getAllCollections({
    filterCollection: (collection) => collection.dataSource === dataSourceKey,
  });

  return (
    <>
      <div>1</div>
    </>
  );
};
CollectionForm.displayName = 'CollectionForm';
