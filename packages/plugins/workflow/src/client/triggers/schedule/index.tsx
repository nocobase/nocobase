import React from 'react';
import { Cascader } from 'antd';

import { useCompile, useCollectionDataSource, useCollectionManager, SchemaInitializerItemOptions } from '@nocobase/client';

import { ScheduleConfig } from './ScheduleConfig';
import { useFlowContext } from '../../FlowContext';
import { BaseTypeSet, useAvailableCollectionFields, useOperandContext } from '../../variable';
import { SCHEDULE_MODE } from './constants';
import { NAMESPACE, useWorkflowTranslation } from '../../locale';
import { CollectionFieldInitializers } from '../../components/CollectionFieldInitializers';
import { CollectionBlockInitializer } from '../../components/CollectionBlockInitializer';
import CollectionFieldSelect from '../../components/CollectionFieldSelect';



function ValueGetter({ onChange }) {
  const { workflow } = useFlowContext();
  const { operand: { options } } = useOperandContext();

  if (!options.type || options.type === 'date') {
    return null;
  }

  return (
    <CollectionFieldSelect
      collection={workflow.config.collection}
      value={options?.path}
      onChange={(path) => {
        onChange(`{{$context.data.${path}}}`);
      }}
    />
  );
}

export default {
  title: `{{t("Schedule event", { ns: "${NAMESPACE}" })}}`,
  type: 'schedule',
  fieldset: {
    config: {
      type: 'object',
      name: 'config',
      'x-component': 'ScheduleConfig',
      'x-component-props': {
      }
    }
  },
  scope: {
    useCollectionDataSource
  },
  components: {
    ScheduleConfig
  },
  getOptions(config, types) {
    const { t } = useWorkflowTranslation();
    const options: any[] = [];
    if (!types || types.includes('date')) {
      options.push({ value: 'date', label: t('Trigger time') });
    }
    if (config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      const fields = useAvailableCollectionFields(config.collection);

      if (fields.length) {
        options.push({
          value: 'data',
          label: t('Trigger data')
        });
      }
    }
    return options;
  },
  useValueGetter(config) {
    if (config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      const fields = useAvailableCollectionFields(config.collection);

      if (!fields.length) {
        return null;
      }
    }

    return ValueGetter;
  },
  useInitializers(config): SchemaInitializerItemOptions | null {
    if (!config.collection) {
      return null;
    }

    return {
      type: 'item',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      component: CollectionBlockInitializer,
      collection: config.collection,
      dataSource: '{{$context.data}}'
    };
  },
  initializers: {
    CollectionFieldInitializers
  }
};
