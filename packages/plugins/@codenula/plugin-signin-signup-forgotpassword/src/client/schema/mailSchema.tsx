import React from 'react';

export default {
    title: `{{t("HTTP request", { ns: "workflow" })}}`,
    type: 'request',
    group: 'extended',
    description: `{{t("Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.", { ns: "workflow" })}}`,
    fieldset: {
     
      
     
     
      data: {
        type: 'string',
        title: `{{t("Body", { ns: "workflow" })}}`,
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'RequestBody',
        'x-component-props': {
          changeOnSelect: true,
          autoSize: {
            minRows: 10,
          },
          placeholder: `{{t("Input request data", { ns: "workflow" })}}`,
        },
        description: `{{t("Only support standard JSON data", { ns: "workflow" })}}`,
      },
      timeout: {
        type: 'number',
        title: `{{t("Timeout config", { ns: "workflow" })}}`,
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'InputNumber',
        'x-component-props': {
          addonAfter: `{{t("ms", { ns: "workflow" })}}`,
          min: 1,
          step: 1000,
          defaultValue: 5000,
        },
      },
      ignoreFail: {
        type: 'boolean',
        title: `{{t("Ignore fail request and continue workflow", { ns: "workflow" })}}`,
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
      },
    },
    
  
  };