import {NAMESPACE} from '../locale';
import { css } from '@emotion/css';
import { ArrayItems } from '@formily/antd';
import React from "react";
import {RequestVarFieldSet} from "../components/RequestVarFieldSet";

export default {
  title: `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`,
  type: 'request',
  group: 'extended',
  fieldset: {
    'config.requestUrl': {
      type: 'string',
      name: 'config.requestUrl',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        className: css`
          .ant-input-affix-wrapper {
            width: 100%;
          }
        `,
      },
      'x-component': 'Input',
      'x-component-props': {
        placeholder: "https://xxxxxx",
        style: {
          width: '100%',
        },
      },
    },
    'config.headers': {
      type: 'array',
      name: 'config.headers',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Request headers", { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name(e.g. Content-Type)", { ns: "${NAMESPACE}" })}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Value(e.g. Application/json)", { ns: "${NAMESPACE}" })}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title:  `{{t("Add request header", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    'config.httpMethod': {
      type: 'string',
      name: 'config.httpMethod',
      required: true,
      title: `{{t("HTTP method", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'POST',
        showSearch: false,
        allowClear: false,
      },
      enum: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
      ],
    },
    'variables': {
      type: 'object',
      title: `{{t("Available variables", { ns: "${NAMESPACE}" })}}`,
      name: 'variables',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
      },
      'x-component': 'RequestVarFieldSetConfig',
    },
    'config.postMethodData': {
      type: 'string',
      name: 'config.postMethodData',
      'x-hidden': false,
      title: `{{t("POST method request data", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        className: css`
          .ant-input-affix-wrapper {
            width: 100%;
          }
        `,
      },
      'x-component': 'Input.TextArea',
      'x-component-props': {
        placeholder: `{{t("Input POST method request data", { ns: "${NAMESPACE}" })}}`,
        style: {
          width: '100%',
        },
      },
      description: `{{t("You can use the above available variables in request data (supported by ejs https://ejs.co )", { ns: "${NAMESPACE}" })}}`,
      'x-reactions': [
        {
          dependencies: ['config.httpMethod'],
          when: "{{$deps[0]=='POST' || $deps[0]==null}}",
          fulfill: {
            schema: {
              'x-hidden': false,
            },
          },
          otherwise: {
            schema: {
              'x-hidden': true,
            },
          },
        },
      ],
    },
    'config.getMethodParam': {
      type: 'object',
      name: 'config.getMethodParam',
      title: `{{t("GET method request param", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        className: css`
          .ant-input-affix-wrapper {
            width: 100%;
          }
        `,
      },
      default: null,
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: {
          minRows: 5,
          // maxRows: 20,
        },
        placeholder: `{{t("Input GET method request param", { ns: "${NAMESPACE}" })}}`,
        style: {
          width: '100%',
        },
      },
      description: `{{t("You can use the above available variables in request param (supported by ejs https://ejs.co )", { ns: "${NAMESPACE}" })}}`,
      'x-reactions': [
        {
          dependencies: ['config.httpMethod'],
          when: "{{$deps[0]=='GET'}}",
          fulfill: {
            schema: {
              'x-hidden': false,
            },
          },
          otherwise: {
            schema: {
              'x-hidden': true,
            },
          },
        },
      ],
    },
  },
  view: {},
  scope: {},
  components: {
    ArrayItems,
    RequestVarFieldSetConfig({ value, onChange }) {
      return (
        <RequestVarFieldSet {...value} onChange={onChange} />
      );
    }
  }
};
