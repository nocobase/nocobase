/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionRecordData, useFilterByTk } from '@nocobase/client';
import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../locale';
export const ConfigureLink = () => {
  const value = useFilterByTk();
  const recordData = useCollectionRecordData();
  const t = useT();
  let to = `/admin/settings/block-templates/inherited/${value}`;
  if (recordData.type === 'Mobile') {
    to = `/m/block-templates/inherited/${recordData.key}/${recordData.uid}`;
  }

  return <Link to={to}>{t('Configure')}</Link>;
};
