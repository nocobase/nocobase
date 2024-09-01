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

  useEffect(() => {
    if (!(field.onUnmount as any).__rested) {
      const _onUnmount = field.onUnmount;
      field.onUnmount = () => {
        (field as any).__disposes?.forEach((dispose) => {
          dispose();
        });
        _onUnmount();
      };
      (field.onUnmount as any).__rested = true;
    }

    if (!linkageRules) {
      return;
    }

    if ((field as any).__disposes) {
      (field as any).__disposes.forEach((dispose) => {
        dispose();
      });
    }

    const disposes = ((field as any).__disposes = []);

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

    (field as any).__linkageRules = linkageRules;
  }, [field, fieldSchema?.name, formValue, JSON.stringify(linkageRules), localVariables, variables]);
};

function getLinkageRules(fieldSchema) {
  if (!fieldSchema) {
    return;
  }

  return fieldSchema['x-linkage-rules']?.filter((k) => !k.disabled);
}
