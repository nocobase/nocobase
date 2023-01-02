import React from 'react';
import { Cascader } from 'antd';

import { useCompile, useCollectionDataSource, useCollectionManager, SchemaInitializerItemOptions } from '@nocobase/client';

import { ScheduleConfig } from './ScheduleConfig';
import { useFlowContext } from '../../FlowContext';
import { BaseTypeSet, useOperandContext } from '../../calculators';
import { SCHEDULE_MODE } from './constants';
import { NAMESPACE, useWorkflowTranslation } from '../../locale';
import { CollectionFieldInitializers } from '../../components/CollectionFieldInitializers';
import { CollectionBlockInitializer } from '../../components/CollectionBlockInitializer';


function ValueGetter({ onChange }) {
  const { t } = useWorkflowTranslation();
  const compile = useCompile();
  const { collections = [] } = useCollectionManager();
  const { workflow } = useFlowContext();
  const { options } = useOperandContext();
  const path = options?.path ? options.path.split('.') : [];
  if (!options.type || options.type === 'date') {
    return null;
  }
  const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };
  return (
    <Cascader
      placeholder={t('Trigger data')}
      value={path}
      options={collection.fields
        .filter(field => BaseTypeSet.has(field?.uiSchema?.type))
        .map(field => ({
          value: field.name,
          label: compile(field.uiSchema?.title),
        }))}
      onChange={(next) => {
        onChange(`{{$context.${next.join('.')}}}`);
      }}
      allowClear={false}
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
  getOptions(config) {
    const { t } = useWorkflowTranslation();
    const options: any[] = [
      { value: 'date', label: t('Trigger time') },
    ];
    if (config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      options.push({
        value: 'data',
        label: t('Trigger data')
      });
    }
    return options;
  },
  useFields(config) {
    return [];
  },
  useValueGetter(config) {
    return ValueGetter;
  },
  useInitializers(config): SchemaInitializerItemOptions {
    if (!config.collection) {
      return null;
    }

    return {
      type: 'item',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      component: CollectionBlockInitializer,
      collectionName: config.collection
    };
  },
  initializers: {
    CollectionFieldInitializers
  }
};
