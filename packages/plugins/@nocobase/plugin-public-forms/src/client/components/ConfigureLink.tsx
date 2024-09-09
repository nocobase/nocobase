/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFilterByTk } from '@nocobase/client';
import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../locale';
export function ConfigureLink() {
  const value = useFilterByTk();
  const t = useT();

  return <Link to={`/admin/settings/public-forms/${value}`}>{t('Configure')}</Link>;
}
