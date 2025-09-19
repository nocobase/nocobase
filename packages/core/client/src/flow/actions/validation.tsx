/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT, jioToJoiSchema } from '@nocobase/flow-engine';
import { FieldValidation } from '../../collection-manager';

export const validation = defineAction({
  title: escapeT('Validation'),
  name: 'validation',
  uiSchema: (ctx) => {
    const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
      ctx.model.collectionField.interface,
    );
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
      const rules = ctx.model.getProps().rules || [];
      const schema = jioToJoiSchema(params.validation);
      const label = ctx.model.props.label;
      rules.push({
        validator: (_, value) => {
          const { error } = schema.validate(value, {
            context: { label },
            abortEarly: false,
          });

          if (error) {
            const message = error.details.map((d: any) => d.message.replace(/"value"/g, `"${label}"`)).join(', ');
            return Promise.reject(message);
          }

          return Promise.resolve();
        },
      });
      const hasRequiredInCollection = params.validation.rules.some((rule) => rule.name === 'required');
      ctx.model.setProps({
        rules,
        required: hasRequiredInCollection,
        validation: params.validation,
      });
    }
  },
});
