/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { useCollectionRecordData } from '../../../../../data-source/collection-record/CollectionRecordProvider';
import { useSatisfiedActionValues } from '../../../../../schema-settings/LinkageRules/useActionValues';
export function useDataFormItemProps() {
  const data = useCollectionRecordData();
  const { valueMap: style } = useSatisfiedActionValues({ category: 'style', formValues: data });
  return { wrapperStyle: style };
}
