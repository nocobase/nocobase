import { useCollectionDataSource, SchemaInitializerItemOptions } from '@nocobase/client';

import { ScheduleConfig } from './ScheduleConfig';
import { SCHEDULE_MODE } from './constants';
import { NAMESPACE, useWorkflowTranslation } from '../../locale';
import { CollectionFieldInitializers } from '../../components/CollectionFieldInitializers';
import { CollectionBlockInitializer } from '../../components/CollectionBlockInitializer';
import { useCollectionFieldOptions } from '../../components/CollectionFieldSelect';



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
      options.push({ key: 'date', value: 'date', label: t('Trigger time') });
    }
    if (config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      const fieldOptions = useCollectionFieldOptions({ collection: config.collection });

      if (fieldOptions.length) {
        options.push({
          key: 'data',
          value: 'data',
          label: t('Trigger data'),
          children: fieldOptions
        });
      }
    }
    return options;
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
