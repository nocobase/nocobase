import { css } from '@emotion/css';
import { useForm } from '@formily/react';
import { useCollectionFilterOptions } from '@nocobase/client';
import { NAMESPACE } from '../locale';

export const collection = {
  type: 'string',
  title: '{{t("Collection")}}',
  required: true,
  'x-reactions': [],
  'x-decorator': 'FormItem',
  'x-component': 'CollectionSelect',
  'x-component-props': {
    dropdownMatchSelectWidth: false,
  },
};

export const values = {
  type: 'object',
  title: '{{t("Fields values")}}',
  'x-decorator': 'FormItem',
  'x-decorator-props': {
    labelAlign: 'left',
    className: css`
      flex-direction: column;
    `,
  },
  'x-component': 'CollectionFieldset',
  description: `{{t("Unassigned fields will be set to default values, and those without default values will be set to null.", { ns: "${NAMESPACE}" })}}`,
};

export const filter = {
  type: 'object',
  title: '{{t("Filter")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Filter',
  'x-component-props': {
    useProps() {
      const { values } = useForm();
      const options = useCollectionFilterOptions(values?.collection);
      return {
        options,
        className: css`
          position: relative;
          width: 100%;
        `,
      };
    },
    dynamicComponent: 'FilterDynamicComponent',
  },
};

export const appends = {
  type: 'array',
  title: `{{t("Preload associations", { ns: "${NAMESPACE}" })}}`,
  description: `{{t("Please select the associated fields that need to be accessed in subsequent nodes", { ns: "${NAMESPACE}" })}}`,
  'x-decorator': 'FormItem',
  'x-component': 'FieldsSelect',
  'x-component-props': {
    mode: 'multiple',
    placeholder: '{{t("Select Field")}}',
    filter(field) {
      return ['linkTo', 'belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type);
    },
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
};
