/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer, useForm } from '@formily/react';

/**
 * show form data for doc demo
 * @internal
 */
export const ShowFormData = observer(({ children }) => {
  const form = useForm();
  return (
    <>
      {
        <pre style={{ marginBottom: 20 }} data-testid="form-data">
          {JSON.stringify(form.values, null, 2)}
        </pre>
      }
      {children}
    </>
  );
});
