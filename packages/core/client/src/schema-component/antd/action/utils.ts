/*
 * @Author: Semmy Wong
 * @Date: 2022-05-29 16:19:48
 * @LastEditors: Semmy Wong
 * @LastEditTime: 2022-05-30 21:39:05
 * @Description: 描述
 */
import type { ISchema } from '@formily/react';

export const requestSettingsSchema: ISchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      title: '{{t("Request API URL")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    method: {
      type: 'string',
      title: '{{t("Request API method")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
    },
    headers: {
      type: 'string',
      title: '{{t("Request API headers")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    params: {
      type: 'string',
      title: '{{t("Request API parameters")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    data: {
      type: 'string',
      title: '{{t("Request API body")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
};
