import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Variable,css} from '@nocobase/client';
import React from 'react';

export const bodySchema = {
  fieldset: {
    subject: {
      type: 'string',
      title: 'Email Subject',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    body: {
      type: 'string',
      title: `{{t("Email Body", { ns: "sdf" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'Variable.RawTextArea',
      'x-component-props': {
        changeOnSelect: true,
        autoSize: {
          minRows: 10,
        },
        placeholder: `{{t("Input request data", { ns: "sdf" })}}`,
      },
      description: `{{t("Only support standard JSON data", { ns: "sdf" })}}`,
    },
    components:{
      RequestBody() {
       
      
        const scope = [
          { key: 'key', label: 'username', value: 'username' },
          { key: 'key', label: 'email', value: 'email' },
          { key: 'key', label: 'phone', value: 'phone' },
        ];
        return <Variable.RawTextArea scope={scope} />;
      }
    }
  
  },
  
};

export const emailSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues: '{{ useEmailValues }}',
      },
      'x-component': 'div',
      type: 'void',
      title: 'Email body',
      
      properties: {
        
        subject: {
          type: 'string',
          title: 'Email Subject',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        body: {
          type: 'string',
          title: `{{t("Email Body", { ns: "sdf" })}}`,
          'x-decorator': 'FormItem',
          'x-decorator-props': {},
          'x-component': 'RichText',
          'x-component-props': {
            changeOnSelect: true,
            autoSize: {
              minRows: 10,
            },
            placeholder: `{{t("Input request data", { ns: "sdf" })}}`,
          },
          description: `{{t("Only support standard JSON data", { ns: "sdf" })}}`,
        },
        


        footer1: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            layout: 'one-column',
          },
          properties: {
            send: {
              title: '{{t("Set value")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useAction: '{{ useSetValue }}',
              },
            },
          },
        },
      },
    },
  },
};

