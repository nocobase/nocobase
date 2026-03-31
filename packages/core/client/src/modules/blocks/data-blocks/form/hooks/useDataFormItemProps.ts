/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionRecordData } from '../../../../../data-source/collection-record/CollectionRecordProvider';
import { useSatisfiedActionValues } from '../../../../../schema-settings/LinkageRules/useActionValues';
import { useFormBlockContext } from '../../../../../block-provider';
import { useSubFormValue } from '../../../../../schema-component/antd/association-field/hooks';
import { useFlag } from '../../../../../flag-provider/hooks/useFlag';

export function useDataFormItemProps() {
  const record = useCollectionRecordData();
  const { form } = useFormBlockContext();
  const subForm = useSubFormValue();
  const { isInSubTable } = useFlag();

  const { valueMap: style } = useSatisfiedActionValues({
    category: 'style',
    formValues: subForm?.formValue || form?.values || record,
    form,
  });
  const wrapperStyle = isInSubTable
    ? Object.fromEntries(Object.entries(style || {}).filter(([key]) => key !== 'backgroundColor'))
    : style;
  return { wrapperStyle };
}
