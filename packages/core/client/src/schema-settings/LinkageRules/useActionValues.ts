/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState, useEffect } from 'react';
import { useVariables, useLocalVariables } from '../../variables';
import { useFieldSchema } from '@formily/react';
import { LinkageRuleCategory, LinkageRuleDataKeyMap } from './type';
import { getSatisfiedValueMap } from './compute-rules';
import { isEmpty } from 'lodash';
export function useSatisfiedActionValues({
  formValues,
  category = 'default',
  rules,
  schema,
}: {
  category: `${LinkageRuleCategory}`;
  formValues: Record<string, any>;
  rules?: any;
  schema?: any;
}) {
  const [valueMap, setValueMap] = useState({});
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: { values: formValues } as any });
  const localSchema = schema ?? fieldSchema;
  const linkageRules = rules ?? localSchema[LinkageRuleDataKeyMap[category]];

  useEffect(() => {
    if (linkageRules && formValues) {
      getSatisfiedValueMap({ rules: linkageRules, variables, localVariables })
        .then((valueMap) => {
          if (!isEmpty(valueMap)) {
            setValueMap(valueMap);
          } else setValueMap({});
        })
        .catch((err) => {
          throw new Error(err.message);
        });
    }
  }, [variables, localVariables, formValues, linkageRules]);
  return { valueMap };
}
