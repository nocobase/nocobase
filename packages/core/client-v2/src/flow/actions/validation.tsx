/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, jioToJoiSchema, tExpr } from '@nocobase/flow-engine';
import { FieldValidation } from '../../flow-compat';

type ValidationType = 'string' | 'number' | 'array' | 'boolean' | 'any';

interface ValidationRule {
  name: string;
  args?: any;
}

interface ValidationData {
  type: ValidationType;
  rules?: ValidationRule[];
}

interface ValidationContext {
  model: {
    props: {
      label?: string;
    };
  };
  t: (key: string, options?: Record<string, unknown>) => string;
}

function buildValidationRules(ctx: ValidationContext, validation: ValidationData) {
  const rules = [];
  const schema = jioToJoiSchema(validation);
  const label = ctx.model.props.label;
  rules.push({
    validator: (_: unknown, value: unknown) => {
      const { error } = schema.validate(value, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((d: { type: string; context?: Record<string, unknown> }) => {
          return ctx.t(`${d.type}`, {
            ...d.context,
            ns: 'data-source-main',
            label,
          });
        });
        const div = document.createElement('div');
        div.innerHTML = messages.join('; ');
        return Promise.reject(div.textContent);
      }

      return Promise.resolve();
    },
  });
  return rules;
}

export const validation = defineAction({
  title: tExpr('Validation'),
  name: 'validation',
  uiSchema: (ctx) => {
    if (!ctx.model.collectionField) {
      return;
    }
    const targetInterface = ctx.model.collectionField.getInterfaceOptions();
    if (!targetInterface?.validationType) {
      return null;
    }
    return {
      validation: {
        'x-decorator': 'FormItem',
        'x-component': FieldValidation,
        'x-component-props': {
          type: targetInterface.validationType,
          availableValidationOptions: [...new Set(targetInterface.availableValidationOptions)],
          excludeValidationOptions: [...new Set(targetInterface.excludeValidationOptions)],
          inheritedValue: ctx.model.collectionField.validation,
          isAssociation: targetInterface.isAssociation,
        },
      },
    };
  },
  handler(ctx, params) {
    if (params.validation) {
      const collectionValidation = ctx.model.collectionField?.validation;
      const collectionRules = ctx.model.collectionField?.getComponentProps?.().rules || [];
      const uiRules = params.validation.rules?.length
        ? buildValidationRules(ctx as unknown as ValidationContext, params.validation)
        : [];
      const hasRequiredInValidation = [collectionValidation, params.validation].some(
        (validation) => validation?.rules?.some((rule) => rule.name === 'required'),
      );
      if (hasRequiredInValidation) {
        ctx.model.setProps({
          required: hasRequiredInValidation,
        });
      }
      ctx.model.setProps({
        rules: [...collectionRules, ...uiRules],
        validation: params.validation,
      });
    }
  },
});
