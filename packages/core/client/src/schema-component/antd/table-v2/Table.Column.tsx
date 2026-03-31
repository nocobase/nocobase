/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';

export const TableColumn = (props) => {
  const field = useField();
  const { t } = useTranslation();
  return <div role="button">{t(field.title, { ns: NAMESPACE_UI_SCHEMA })}</div>;
};
