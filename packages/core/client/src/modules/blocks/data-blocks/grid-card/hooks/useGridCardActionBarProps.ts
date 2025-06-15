/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useDesignable } from '../../../../../schema-component';

export const useGridCardActionBarProps = () => {
  const fieldSchema = useFieldSchema();
  const { designable } = useDesignable();

  return {
    style: {
      marginBottom: 'var(--nb-spacing)',
    },

    // In non-configuration mode, when there are no buttons, ActionBar doesn't need to be displayed
    hidden: !designable && _.isEmpty(fieldSchema.properties),
  };
};
