import { useCollectionDataSource, SchemaInitializerItemOptions, useCompile, useCollectionManager } from '@nocobase/client';

import { ScheduleConfig } from './ScheduleConfig';
import { SCHEDULE_MODE } from './constants';
import { NAMESPACE, lang } from '../../locale';
import { CollectionBlockInitializer } from '../../components/CollectionBlockInitializer';
import { defaultFieldNames, getCollectionFieldOptions } from '../../variable';
import { FieldsSelect } from '../../components/FieldsSelect';

export default {
  title: `{{t("Schedule event", { ns: "${NAMESPACE}" })}}`,
  type: 'schedule',
  fieldset: {
    config: {
      type: 'void',
      'x-component': 'ScheduleConfig',
      'x-component-props': {},
    },
  },
  scope: {
    useCollectionDataSource,
  },
  components: {
    ScheduleConfig,
    FieldsSelect,
  },
  useVariables(config, opts) {
    const compile = useCompile();
    const { getCollectionFields } = useCollectionManager();
    const { fieldNames = defaultFieldNames } = opts;
    const options: any[] = [];
    if (!opts?.types || opts.types.includes('date')) {
      options.push({ key: 'date', value: 'date', label: lang('Trigger time') });
    }

    const depth = config.appends?.length
      ? config.appends.reduce((max, item) => Math.max(max, item.split('.').length), 1) + 1
      : 1;

    const fieldOptions = getCollectionFieldOptions({
      depth,
      ...opts,
      collection: config.collection,
      compile,
      getCollectionFields,
    });
    if (config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      if (fieldOptions.length) {
        options.push({
          key: 'data',
          [fieldNames.value]: 'data',
          [fieldNames.label]: lang('Trigger data'),
          [fieldNames.children]: fieldOptions,
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
      dataSource: '{{$context.data}}',
    };
  },
  initializers: {},
};
