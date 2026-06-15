/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SubModelItem } from '@nocobase/flow-engine';
import { CONTEXT_TYPE, CONTEXT_TYPE_OPTIONS, EVENT_TYPE } from '../../common/constants';
import { NAMESPACE } from '../locale';

export class CustomActionTrigger {
  title = `{{t("Custom action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('When the "Trigger Workflow" button is clicked, the event is triggered based on different context where the button is located. For complex data processing that cannot be handled simply by built-in operations (CRUD) of NocoBase, you can define a series of operations through a workflow and trigger it with the "Trigger Workflow" button.', { ns: "${NAMESPACE}" })}}`;
  sync = false;

  presetFieldset = {
    type: {
      type: 'number',
      title: `{{t("Context type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: CONTEXT_TYPE_OPTIONS,
      required: true,
      default: CONTEXT_TYPE.GLOBAL,
    },
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
      'x-component-props': {
        dataSourceFilter(item) {
          return item.options.key === 'main' || item.options.isDBInstance;
        },
      },
      ['x-reactions']: [
        {
          dependencies: ['.type'],
          fulfill: {
            state: {
              visible: '{{Boolean($deps[0])}}',
            },
          },
        },
      ],
    },
  };

  fieldset = {
    type: {
      type: 'number',
      title: `{{t("Context type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: CONTEXT_TYPE_OPTIONS,
      default: CONTEXT_TYPE.GLOBAL,
      'x-disabled': true,
    },
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
      'x-disabled': true,
      ['x-reactions']: [
        {
          target: 'appends',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
        {
          dependencies: ['type'],
          fulfill: {
            state: {
              visible: '{{Boolean($deps[0])}}',
            },
          },
        },
      ],
    },
    appends: {
      type: 'array',
      title: `{{t("Associations to use", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.", { ns: "workflow" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'AppendsTreeSelect',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': [
        {
          dependencies: ['collection'],
          fulfill: {
            state: {
              visible: '{{!!$deps[0]}}',
            },
          },
        },
      ],
    },
  };

  triggerFieldset = {
    data: {
      type: 'object',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Use JSON as trigger data for custom data context, or choose a record in single record context.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Input.JSON',
      default: null,
    },
    filterByTk: {
      type: 'array',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Choose a record or primary key of a record in the collection to trigger.", { ns: "workflow" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Input.JSON',
      default: [],
    },
    userId: {
      type: 'number',
      title: `{{t("User acted", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: null,
      required: true,
    },
    roleName: {
      type: 'string',
      title: `{{t("Role of user acted", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: null,
    },
  };

  validate(values) {
    return (
      !values.type ||
      values.type === CONTEXT_TYPE.GLOBAL ||
      ([CONTEXT_TYPE.SINGLE_RECORD, CONTEXT_TYPE.MULTIPLE_RECORDS].includes(values.type) && values.collection)
    );
  }

  isActionTriggerable_deprecated = (config, context) => {
    return context.buttonAction === 'customize:triggerWorkflows' && config.type === CONTEXT_TYPE.SINGLE_RECORD;
  };

  getCreateModelMenuItem({ config }): SubModelItem {
    if (!config.collection) {
      return null;
    }

    return {
      key: 'triggerData',
      label: `{{t("Trigger data", { ns: "workflow" })}}`,
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        use: 'NodeDetailsModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: config.collection,
              dataPath: '$context.data',
            },
          },
          cardSettings: {
            titleDescription: {
              title: `{{t("Trigger data", { ns: "workflow" })}}`,
            },
          },
        },
        subModels: {
          grid: {
            use: 'NodeDetailsGridModel',
            subType: 'object',
          },
        },
      },
    };
  }
}

export { EVENT_TYPE };
