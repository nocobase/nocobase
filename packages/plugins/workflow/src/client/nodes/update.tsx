import React from 'react';
import { onFieldInputValueChange } from '@formily/core';
import { useForm, useField } from '@formily/react';

import { useCollectionDataSource } from '@nocobase/client';

import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import CollectionFieldset, { useCollectionUIFields } from '../components/CollectionFieldset';

import { isValidFilter } from '../utils';
import { NAMESPACE } from '../locale';
import { collection, filter, values } from '../schemas/collection';
import { RadioWithTooltip } from '../components/RadioWithTooltip';

function IndividualHooksRadioWithTooltip({ onChange, ...props }) {
  const form = useForm();
  const { collection } = form.values;
  const fields = useCollectionUIFields(collection);
  const field = useField<any>();

  function onValueChange({ target }) {
    const valuesField = field.query('.values').take();
    if (!valuesField) {
      return;
    }
    const filteredValues = fields.reduce((result, item) => {
      if (
        item.name in valuesField.value &&
        (target.value || !['hasOne', 'hasMany', 'belongsToMany'].includes(item.type))
      ) {
        result[item.name] = valuesField.value[item.name];
      }
      return result;
    }, {});
    form.setValuesIn('params.values', filteredValues);

    onChange(target.value);
  }
  return <RadioWithTooltip {...props} onChange={onValueChange} />;
}

export default {
  title: `{{t("Update record", { ns: "${NAMESPACE}" })}}`,
  type: 'update',
  group: 'collection',
  description: `{{t("Update records of a collection. You can use variables from upstream nodes as query conditions and field values.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    collection,
    params: {
      type: 'object',
      properties: {
        individualHooks: {
          type: 'boolean',
          title: `{{t("Update mode", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'IndividualHooksRadioWithTooltip',
          'x-component-props': {
            options: [
              {
                label: `{{t("Update in a batch", { ns: "${NAMESPACE}" })}}`,
                value: false,
                tooltip: `{{t("Update all eligible data at one time, which has better performance when the amount of data is large. But the updated data will not trigger other workflows, and will not record audit logs.", { ns: "${NAMESPACE}" })}}`,
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
            return isValidFilter(value) ? '' : `{{t("Please add at least one condition", { ns: "${NAMESPACE}" })}}`;
          },
        },
        values: {
          ...values,
          'x-component-props': {
            filter(this, field) {
              return this.params?.individualHooks || !['hasOne', 'hasMany', 'belongsToMany'].includes(field.type);
            },
          },
        },
      },
    },
  },
  view: {},
  scope: {
    useCollectionDataSource,
  },
  components: {
    FilterDynamicComponent,
    CollectionFieldset,
    IndividualHooksRadioWithTooltip,
  },
};
