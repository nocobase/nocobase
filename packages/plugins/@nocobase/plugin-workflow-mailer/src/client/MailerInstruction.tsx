/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { MailOutlined } from '@ant-design/icons';
import { ArrayItems } from '@formily/antd-v5';

import { SchemaComponentContext, css } from '@nocobase/client';
import {
  Instruction,
  WorkflowVariableInput,
  WorkflowVariableRawTextArea,
  WorkflowVariableTextArea,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';

const emailsClass = css`
  width: 100%;

  .ant-space-item:nth-child(2) {
    flex-grow: 1;
  }
`;

export default class extends Instruction {
  title = `{{t("Mailer", { ns: "${NAMESPACE}" })}}`;
  type = 'mailer';
  group = 'extended';
  description = `{{t("Send email. You can use the variables in the upstream nodes as receivers, subject and content of the email.", { ns: "${NAMESPACE}" })}}`;
  icon = (<MailOutlined style={{}} />);
  fieldset = {
    provider: {
      type: 'object',
      properties: {
        server: {
          type: 'void',
          'x-decorator': 'SchemaComponentContext.Provider',
          'x-decorator-props': {
            value: { designable: false },
          },
          'x-component': 'Grid',
          properties: {
            row: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                host: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: 'auto',
                    width: 50,
                  },
                  properties: {
                    host: {
                      type: 'string',
                      required: true,
                      title: `{{t("SMTP host", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkflowVariableInput',
                      'x-component-props': {
                        useTypedConstant: [['string', { placeholder: 'smtp.example.com' }]],
                      },
                    },
                  },
                },
                port: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: '6em',
                    width: 25,
                  },
                  properties: {
                    port: {
                      type: 'number',
                      required: true,
                      title: `{{t("Port", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkflowVariableInput',
                      'x-component-props': {
                        useTypedConstant: [
                          [
                            'number',
                            {
                              min: 1,
                              max: 65535,
                              step: 1,
                            },
                          ],
                        ],
                      },
                      default: 465,
                    },
                  },
                },
                secure: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  'x-component-props': {
                    // flex: '4em',
                    width: 25,
                  },
                  properties: {
                    secure: {
                      type: 'boolean',
                      title: `{{t("Secure", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkflowVariableInput',
                      'x-component-props': {
                        useTypedConstant: [['boolean', { style: { width: '100%' } }]],
                      },
                      default: true,
                    },
                  },
                },
              },
            },
          },
        },
        auth: {
          type: 'void',
          'x-decorator': 'SchemaComponentContext.Provider',
          'x-decorator-props': {
            value: { designable: false },
          },
          'x-component': 'Grid',
          properties: {
            row: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                user: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    'auth.user': {
                      type: 'string',
                      // required: true,
                      title: `{{t("User", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkflowVariableInput',
                      'x-component-props': {
                        useTypedConstant: [['string', { placeholder: 'example@domain.com' }]],
                      },
                    },
                  },
                },
                pass: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    'auth.pass': {
                      type: 'string',
                      // required: true,
                      title: `{{t("Password", { ns: "${NAMESPACE}" })}}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkflowVariableInput',
                      'x-component-props': {
                        useTypedConstant: [['string', { type: 'password' }]],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    from: {
      type: 'string',
      required: true,
      title: `{{t("From", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        useTypedConstant: [['string', { placeholder: 'noreply <example@domain.com>' }]],
      },
    },
    to: {
      type: 'array',
      required: true,
      title: `{{t("To", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'void',
        'x-component': 'Space',
        'x-component-props': {
          className: emailsClass,
        },
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'WorkflowVariableInput',
            'x-component-props': {
              useTypedConstant: ['string'],
              placeholder: `{{t("Email address")}}`,
            },
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add email address", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    cc: {
      type: 'array',
      title: `{{t("CC", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'void',
        'x-component': 'Space',
        'x-component-props': {
          className: emailsClass,
        },
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'WorkflowVariableInput',
            'x-component-props': {
              useTypedConstant: ['string'],
              placeholder: `{{t("Email address")}}`,
            },
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add email address", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    bcc: {
      type: 'array',
      title: `{{t("BCC", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'void',
        'x-component': 'Space',
        'x-component-props': {
          className: emailsClass,
        },
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'WorkflowVariableInput',
            'x-component-props': {
              useTypedConstant: ['string'],
              placeholder: `{{t("Email address")}}`,
            },
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add email address", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    subject: {
      type: 'string',
      // required: true,
      title: `{{t("Subject", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
    },
    contentType: {
      type: 'string',
      title: `{{t("Content type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: 'HTML', value: 'html' },
        { label: `{{t("Plain text", { ns: "${NAMESPACE}" })}}`, value: 'text' },
      ],
      default: 'html',
    },
    html: {
      type: 'string',
      // required: true,
      title: `{{t("Content", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableRawTextArea',
      'x-component-props': {
        placeholder: 'Hi,',
        autoSize: {
          minRows: 10,
        },
      },
      'x-reactions': [
        {
          dependencies: ['contentType'],
          fulfill: {
            state: {
              visible: '{{$deps[0] === "html"}}',
            },
          },
        },
      ],
    },
    text: {
      type: 'string',
      // required: true,
      title: `{{t("Content", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableRawTextArea',
      'x-component-props': {
        placeholder: 'Hi,',
        autoSize: {
          minRows: 10,
        },
      },
      'x-reactions': [
        {
          dependencies: ['contentType'],
          fulfill: {
            state: {
              visible: '{{$deps[0] === "text"}}',
            },
          },
        },
      ],
    },
    // headers: {
    //   type: 'array',
    //   'x-component': 'ArrayItems',
    //   'x-decorator': 'FormItem',
    //   title: `{{t("Headers", { ns: "${NAMESPACE}" })}}`,
    //   description: `{{t('"Content-Type" will be ignored from headers.', { ns: "${NAMESPACE}" })}}`,
    //   items: {
    //     type: 'object',
    //     properties: {
    //       space: {
    //         type: 'void',
    //         'x-component': 'Space',
    //         'x-component-props': {
    //           style: {
    //             flexWrap: 'nowrap',
    //             maxWidth: '100%',
    //           },
    //           className: css`
    //             & > .ant-space-item:first-child,
    //             & > .ant-space-item:last-child {
    //               flex-shrink: 0;
    //             }
    //           `,
    //         },
    //         properties: {
    //           name: {
    //             type: 'string',
    //             'x-decorator': 'FormItem',
    //             'x-component': 'Input',
    //             'x-component-props': {
    //               placeholder: `{{t("Name")}}`,
    //             },
    //           },
    //           value: {
    //             type: 'string',
    //             'x-decorator': 'FormItem',
    //             'x-component': 'WorkflowVariableTextArea',
    //             'x-component-props': {
    //               useTypedConstant: true,
    //               placeholder: `{{t("Value")}}`,
    //             },
    //           },
    //           remove: {
    //             type: 'void',
    //             'x-decorator': 'FormItem',
    //             'x-component': 'ArrayItems.Remove',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   properties: {
    //     add: {
    //       type: 'void',
    //       title: `{{t("Add request header", { ns: "${NAMESPACE}" })}}`,
    //       'x-component': 'ArrayItems.Addition',
    //     },
    //   },
    // },
    ignoreFail: {
      type: 'boolean',
      'x-content': `{{t("Ignore failed sending and continue workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  components = {
    ArrayItems,
    SchemaComponentContext,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
    WorkflowVariableRawTextArea,
  };
}
