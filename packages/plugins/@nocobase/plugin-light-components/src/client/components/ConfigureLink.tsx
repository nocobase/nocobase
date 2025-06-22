/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
// @ts-ignore
import { useCollectionRecordData } from '@nocobase/client';
import { useNavigate } from 'react-router-dom';
import { useT } from '../locale';

export const ConfigureLink = () => {
  const record = useCollectionRecordData();
  const navigate = useNavigate();
  const t = useT();

  const handleClick = () => {
    navigate(`/admin/settings/light-components/configure/${record.key}`);
  };

  return (
    <a onClick={handleClick} style={{ cursor: 'pointer' }}>
      {t('Configure')}
    </a>
  );
};
