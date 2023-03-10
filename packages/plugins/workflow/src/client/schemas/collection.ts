import { css } from "@emotion/css";
import { useForm } from "@formily/react";
import { useCollectionFilterOptions } from "@nocobase/client";
import { NAMESPACE } from "../locale";

export const collection = {
  type: 'string',
  title: '{{t("Collection")}}',
  required: true,
  'x-reactions': ['{{useCollectionDataSource()}}'],
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  'x-component-props': {
    placeholder: '{{t("Select collection")}}'
  }
};

export const values = {
  type: 'object',
  title: '{{t("Fields values")}}',
  'x-decorator': 'FormItem',
  'x-decorator-props': {
    labelAlign: 'left',
    className: css`
      flex-direction: column;
    `
  },
  'x-component': 'CollectionFieldset',
  description: `{{t("Fields that are not assigned a value will be set to the default value, and those that do not have a default value are set to null.", { ns: "${NAMESPACE}" })}}`,
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
        `
      };
    },
    dynamicComponent: 'FilterDynamicComponent'
  }
};

export const appends = {
  type: 'array',
  title: `{{t("Preload associations", { ns: "${NAMESPACE}" })}}`,
  description: `{{t("Only configured association field could be accessed in following nodes", { ns: "${NAMESPACE}" })}}`,
  'x-decorator': 'FormItem',
  'x-component': 'FieldsSelect',
  'x-component-props': {
    mode: 'multiple',
    placeholder: '{{t("Select Field")}}',
    filter(field) {
      return ['linkTo', 'belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type);
    }
  },
  'x-reactions': [
    {
      dependencies: ['collection'],
      fulfill: {
        state: {
          visible: '{{!!$deps[0]}}',
        },
      }
    },
  ]
};
