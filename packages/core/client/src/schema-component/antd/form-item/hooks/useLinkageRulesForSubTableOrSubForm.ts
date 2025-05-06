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
import { Schema, useField, useFieldSchema } from '@formily/react';
import { useEffect } from 'react';
import { bindLinkageRulesToFiled } from '../../../../schema-settings/LinkageRules/bindLinkageRulesToFiled';
import { forEachLinkageRule } from '../../../../schema-settings/LinkageRules/forEachLinkageRule';
import useLocalVariables from '../../../../variables/hooks/useLocalVariables';
import useVariables from '../../../../variables/hooks/useVariables';
import { useSubFormValue } from '../../association-field/hooks';
import { useApp } from '../../../../application';
import { isSubMode } from '../../association-field/util';

const isSubFormOrSubTableField = (fieldSchema: Schema) => {
  while (fieldSchema) {
    if (isSubMode(fieldSchema)) {
      return true;
    }

    if (fieldSchema['x-component'] === 'FormV2') {
      return false;
    }

    fieldSchema = fieldSchema.parent;
  }

  return false;
};

/**
 * used to bind the linkage rules of the sub-table or sub-form with the current field
 */
export const useLinkageRulesForSubTableOrSubForm = () => {
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const { fieldSchema: schemaOfSubTableOrSubForm, formValue } = useSubFormValue();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  const linkageRules = getLinkageRules(schemaOfSubTableOrSubForm);
  const app = useApp();

  useEffect(() => {
    if (!isSubFormOrSubTableField(fieldSchema)) {
      return;
    }

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
          bindLinkageRulesToFiled(
            {
              field,
              linkageRules,
              formValues: formValue,
              localVariables,
              action,
              rule,
              variables,
              variableNameOfLeftCondition: '$iteration',
            },
            app.jsonLogic,
          ),
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
  const result = fieldSchema['x-linkage-rules'] || fieldSchema?.parent?.['x-linkage-rules'] || [];

  return result?.filter((k) => !k.disabled);
}
