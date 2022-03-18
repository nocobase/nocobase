import { ISchema } from '@formily/react';
import { Registry } from '@nocobase/utils';

import query from './query';

export interface Instruction {
  title: string;
  type: string;
  schema: { [key: string]: ISchema };
};

export const instructions = new Registry<Instruction>();

export function getInstructionSchema(type): ISchema {
  const { title, schema } = instructions.get(type);

  return {
    type: 'object',
    properties: {
      link: {
        type: 'void',
        title,
        'x-component': 'Action.Link',
        'x-component-props': {
          type: 'primary',
        },
        properties: {
          drawer: {
            type: 'void',
            'x-component': 'Action.Drawer',
            'x-decorator': 'Form',
            properties: {
              title: {
                type: 'string',
                title: '节点名称',
                'x-component': 'Input',
                'x-decorator': 'FormItem',
                default: title
              } as ISchema,
              ...schema,
              actions: {
                type: 'void',
                'x-component': 'Action.Drawer.Footer',
                properties: {
                  cancel: {
                    title: '{{t("Cancel")}}',
                    'x-component': 'Action',
                    'x-component-props': {
                      // useAction: '{{ cm.useCancelAction }}',
                    },
                  },
                  submit: {
                    title: '{{t("Submit")}}',
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                      // useAction: '{{ cm.useCreateAction }}',
                    },
                  },
                },
              } as ISchema
            }
          }

        }
      }
    }
  };
}

export function getAllInstructionsSchema() {
  const schema = {};
  for (let type of instructions.getKeys()) {
    Object.assign(schema, { [type]: getInstructionSchema(type) });
  }

  return schema;
}

instructions.register('query', query);
