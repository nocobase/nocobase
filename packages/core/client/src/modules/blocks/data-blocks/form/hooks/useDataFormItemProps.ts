/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { useSatisfiedActionValues } from '../../../../../schema-settings/LinkageRules/useActionValues';
export function useDataFormItemProps() {
  const form = useForm();
  const { valueMap: style } = useSatisfiedActionValues({ category: 'style', formValues: form?.values });
  return { wrapperStyle: style };
}
