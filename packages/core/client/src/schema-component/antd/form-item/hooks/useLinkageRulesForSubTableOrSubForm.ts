/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useEffect } from 'react';
import { useFlag } from '../../../../flag-provider';
import { bindLinkageRulesToFiled } from '../../../../schema-settings/LinkageRules/bindLinkageRulesToFiled';
import { forEachLinkageRule } from '../../../../schema-settings/LinkageRules/forEachLinkageRule';
import useLocalVariables from '../../../../variables/hooks/useLocalVariables';
import useVariables from '../../../../variables/hooks/useVariables';
import { useSubFormValue } from '../../association-field/hooks';

/**
 * used to bind the linkage rules of the sub-table or sub-form with the current field
 */
export const useLinkageRulesForSubTableOrSubForm = () => {
  const { isInSubForm, isInSubTable } = useFlag();

  if (!isInSubForm && !isInSubTable) {
    return;
  }

  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { fieldSchema: schemaOfSubTableOrSubForm, formValue } = useSubFormValue();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  const linkageRules = getLinkageRules(schemaOfSubTableOrSubForm);

  console.log('linkageRules', linkageRules);

  useEffect(() => {
    if (!linkageRules) {
      return;
    }

    const disposes = [];

    forEachLinkageRule(linkageRules, (action, rule) => {
      if (action.targetFields?.includes(fieldSchema.name)) {
        disposes.push(
          bindLinkageRulesToFiled({
            field,
            linkageRules,
            formValues: formValue,
            localVariables,
            action,
            rule,
            variables,
          }),
        );
      }
    });

    return () => {
      disposes.forEach((dispose) => {
        dispose();
      });
    };
  }, [field, fieldSchema?.name, formValue, linkageRules, localVariables, variables]);
};

function getLinkageRules(fieldSchema) {
  if (!fieldSchema) {
    return;
  }

  return fieldSchema['x-linkage-rules']?.filter((k) => !k.disabled);
}
