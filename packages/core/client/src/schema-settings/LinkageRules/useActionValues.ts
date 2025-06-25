/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, onFormValuesChange } from '@formily/core';
import { Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocalVariables, useVariables } from '../../variables';
import { getSatisfiedValueMap } from './compute-rules';
import { LinkageRuleCategory, LinkageRuleDataKeyMap } from './type';
import { useApp } from '../../application';
export function useSatisfiedActionValues({
  formValues,
  category = 'default',
  rules,
  schema,
  form,
}: {
  category: `${LinkageRuleCategory}`;
  formValues: Record<string, any>;
  rules?: any;
  schema?: any;
  form?: Form;
}) {
  const [valueMap, setValueMap] = useState({});
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: { values: formValues } as any });
  const localSchema = schema ?? fieldSchema;
  const styleRules =
    rules ?? (localSchema[LinkageRuleDataKeyMap[category]] || localSchema?.parent[LinkageRuleDataKeyMap[category]]);
  const app = useApp();

  const compute = useCallback(() => {
    if (styleRules && formValues) {
      getSatisfiedValueMap({ rules: styleRules, variables, localVariables }, app.jsonLogic)
        .then((valueMap) => {
          if (!isEmpty(valueMap)) {
            setValueMap(valueMap);
          } else setValueMap({});
        })
        .catch((err) => {
          throw new Error(err.message);
        });
    }
  }, [variables, localVariables, styleRules, formValues]);

  useEffect(() => {
    compute();

    if (form) {
      const id = uid();
      form.addEffects(id, () => {
        onFormValuesChange(() => {
          compute();
        });
      });
      return () => {
        form.removeEffects(id);
      };
    }
  }, [form, compute, formValues]);

  return { valueMap };
}

export const GetStyleRules: React.FC<{
  record: Record<string, any>;
  schema: Schema;
  onStyleChange?: (value: Record<string, any>) => void;
}> = React.memo(({ record, schema, onStyleChange }) => {
  const { valueMap } = useSatisfiedActionValues({ formValues: record, category: 'style', schema });

  useEffect(() => {
    onStyleChange(valueMap);
  }, [onStyleChange, valueMap]);

  return null;
});

GetStyleRules.displayName = 'GetStyleRules';
