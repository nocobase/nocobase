/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { css, SchemaComponent } from '@nocobase/client';
import { FlowModel, tExpr } from '@nocobase/flow-engine';
import { Tooltip } from 'antd';
import { StructuredOutput } from '../components/structured-output';
import { AssigneesSelect, AssigneesAddition } from '../components/assigness';
import { namespace } from '../../../../locale';

export class AIEmployeeTaskFeedbackModel extends FlowModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineMethod('t', (key, options) => {
      return this.context.i18n.t(key, {
        ...options,
        ns: namespace,
      });
    });
  }

  public render() {
    return (
      <SchemaComponent
        components={{ StructuredOutput, AssigneesSelect, AssigneesAddition }}
        schema={{
          type: 'void',
          properties: {
            output: {
              type: 'void',
              'x-component': StructuredOutput,
            },
            requiresApproval: {
              title: tExpr('Approval & Notice', { ns: namespace }),
              type: 'string',
              default: 'no_required',
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                tooltip: tExpr(
                  'Configure whether task output should be sent to specified users for notification, carbon copy, or approval',
                  {
                    ns: namespace,
                  },
                ),
              },
              'x-component': 'Radio.Group',
              enum: [
                {
                  label: (
                    <Tooltip title={this.context.t('Do not initiate approval')}>
                      <span>{this.context.t('No required')}</span>
                    </Tooltip>
                  ),
                  value: 'no_required',
                },
                {
                  label: (
                    <Tooltip title={this.context.t('Initiate approval when needed')}>
                      <span>{this.context.t('AI decision')}</span>
                    </Tooltip>
                  ),
                  value: 'ai_decision',
                },
                {
                  label: (
                    <Tooltip title={this.context.t('Always initiate approval')}>
                      <span>{this.context.t('Human decision')}</span>
                    </Tooltip>
                  ),
                  value: 'human_decision',
                },
              ],
            },
            assignees: {
              type: 'array',
              title: `{{t("Assignees", { ns: "${namespace}" })}}`,
              'x-reactions': [
                {
                  dependencies: ['.requiresApproval'],
                  fulfill: {
                    schema: {
                      'x-visible': '{{$deps[0] !== "no_required"}}',
                    },
                    state: {
                      required: '{{$deps[0] !== "no_required"}}',
                    },
                  },
                },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems',
              'x-component-props': {
                className: css`
                  &[disabled] {
                    > .ant-formily-array-base-addition {
                      display: none;
                    }
                    > .ant-formily-array-items-item .ant-space-item:not(:nth-child(2)) {
                      display: none;
                    }
                  }
                `,
              },
              items: {
                type: 'void',
                'x-component': 'Space',
                'x-component-props': {
                  className: css`
                    width: 100%;
                    &.ant-space.ant-space-horizontal {
                      flex-wrap: nowrap;
                    }
                    > .ant-space-item:nth-child(2) {
                      flex-grow: 1;
                    }
                  `,
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
                    'x-component': 'AssigneesSelect',
                  },
                  remove: {
                    type: 'void',
                    'x-decorator': 'FormItem',
                    'x-component': 'ArrayItems.Remove',
                  },
                },
              },
              required: true,
              properties: {
                add: {
                  type: 'void',
                  title: `{{t("Add assignee", { ns: "${namespace}" })}}`,
                  'x-component': 'AssigneesAddition',
                },
              },
            },
          },
        }}
      />
    );
  }
}
