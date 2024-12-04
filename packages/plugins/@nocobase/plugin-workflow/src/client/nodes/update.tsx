/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { EditOutlined } from '@ant-design/icons';

import { useCollectionDataSource } from '@nocobase/client';
import { isValidFilter } from '@nocobase/utils/client';

import CollectionFieldset from '../components/CollectionFieldset';
import { AssignedFieldsFormSchemaConfig } from '../components/AssignedFieldsFormSchemaConfig';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';

import { RadioWithTooltip } from '../components/RadioWithTooltip';
import { NAMESPACE, lang } from '../locale';
import { collection, filter, values } from '../schemas/collection';
import { Instruction, useNodeSavedConfig } from '.';

export default class extends Instruction {
  title = `{{t("Update record", { ns: "${NAMESPACE}" })}}`;
  type = 'update';
  group = 'collection';
  description = `{{t("Update records of a collection. You can use variables from upstream nodes as query conditions and field values.", { ns: "${NAMESPACE}" })}}`;
  icon = (<EditOutlined style={{}} />);
  fieldset = {
    collection: {
      ...collection,
      'x-disabled': '{{ useNodeSavedConfig(["collection"]) }}',
      'x-reactions': [
        ...collection['x-reactions'],
        {
          target: 'params',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
        {
          target: 'params.filter',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: '{{Object.create({})}}',
            },
          },
        },
        {
          target: 'params.values',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: '{{Object.create({})}}',
            },
          },
        },
      ],
    },
    params: {
      type: 'object',
      properties: {
        individualHooks: {
          type: 'boolean',
          title: `{{t("Update mode", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'RadioWithTooltip',
          'x-component-props': {
            options: [
              {
                label: `{{t("Update in a batch", { ns: "${NAMESPACE}" })}}`,
                value: false,
                tooltip: `{{t("Update all eligible data at one time, which has better performance when the amount of data is large. But association fields are not supported (unless foreign key in current collection), and the updated data will not trigger other workflows.", { ns: "${NAMESPACE}" })}}`,
              },
              {
                label: `{{t("Update one by one", { ns: "${NAMESPACE}" })}}`,
                value: true,
                tooltip: `{{t("The updated data can trigger other workflows, and the audit log will also be recorded. But it is usually only applicable to several or dozens of pieces of data, otherwise there will be performance problems.", { ns: "${NAMESPACE}" })}}`,
              },
            ],
          },
          default: false,
        },
        filter: {
          ...filter,
          title: `{{t("Only update records matching conditions", { ns: "${NAMESPACE}" })}}`,
          ['x-validator'](value) {
            return isValidFilter(value) ? '' : lang('Please add at least one condition');
          },
        },
        values: {
          ...values,
          'x-reactions': [
            {
              dependencies: ['collection', 'usingAssignFormSchema'],
              fulfill: {
                state: {
                  display: '{{($deps[0] && !$deps[1]) ? "visible" : "hidden"}}',
                },
              },
            },
          ],
        },
      },
    },
    usingAssignFormSchema: {
      type: 'boolean',
    },
    assignFormSchema: {
      type: 'object',
      title: '{{t("Fields values")}}',
      'x-decorator': 'FormItem',
      'x-component': 'AssignedFieldsFormSchemaConfig',
      'x-reactions': [
        {
          dependencies: ['collection', 'usingAssignFormSchema'],
          fulfill: {
            state: {
              display: '{{($deps[0] && $deps[1]) ? "visible" : "hidden"}}',
            },
          },
        },
      ],
    },
  };
  createDefaultConfig() {
    return {
      usingAssignFormSchema: true,
      assignFormSchema: {},
    };
  }
  scope = {
    useCollectionDataSource,
    useNodeSavedConfig,
  };
  components = {
    FilterDynamicComponent,
    CollectionFieldset,
    AssignedFieldsFormSchemaConfig,
    RadioWithTooltip,
  };
}
