/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollection, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldSchema } from '@formily/react';

export function AssociationRecordSetting(props) {
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const collection = useCollection();
  const choices = [
    {
      key: '1',
      title: 'None',
      value: 'None',
    },
    {
      key: '2',
      title: 'Current',
      value: 'Current',
    },
    {
      key: '3',
      title: 'Association',
      value: 'Association',
    },
  ];

  return <span>AssociationRecordSetting</span>;
}
