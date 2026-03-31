/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, jioToJoiSchema, tExpr } from '@nocobase/flow-engine';
import { FieldValidation } from '../../collection-manager';

export const validation = defineAction({
  title: tExpr('Validation'),
  name: 'validation',
  uiSchema: (ctx) => {
    if (!ctx.model.collectionField) {
      return;
    }
    const targetInterface = ctx.model.collectionField.getInterfaceOptions();
    if (!targetInterface.validationType) {
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
          isAssociation: targetInterface.isAssociation,
        },
      },
    };
  },
  handler(ctx, params) {
    if (params.validation) {
      const rules = [];
      const schema = jioToJoiSchema(params.validation);
      const label = ctx.model.props.label;
      rules.push({
        validator: (_, value) => {
          const { error } = schema.validate(value, {
            abortEarly: false,
          });

          if (error) {
            const messages = error.details.map((d) => {
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
      const hasRequiredInCollection = params.validation.rules.some((rule) => rule.name === 'required');
      if (hasRequiredInCollection) {
        ctx.model.setProps({
          required: hasRequiredInCollection,
        });
      }
      console.log(rules);
      ctx.model.setProps({
        rules,
        validation: params.validation,
      });
    }
  },
});
