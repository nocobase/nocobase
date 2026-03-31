/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { useDepartmentTranslation } from '../locale';
import { AssociationField } from '@nocobase/client';
import { connect, mapReadPretty } from '@formily/react';

export const ReadOnlyAssociationField = connect(() => {
  const { t } = useDepartmentTranslation();
  return <div style={{ color: '#ccc' }}>{t('This field is currently not supported for use in form blocks.')} </div>;
}, mapReadPretty(AssociationField.ReadPretty));
