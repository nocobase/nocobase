import { css } from "@emotion/css";
import { useForm } from "@formily/react";
import { useCollectionFilterOptions } from "@nocobase/client";

export const collection = {
  type: 'string',
  title: '{{t("Collection")}}',
  name: 'config.collection',
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
  name: 'config.params.values',
  'x-decorator': 'FormItem',
  'x-decorator-props': {
    labelAlign: 'left',
    className: css`
      flex-direction: column;
    `
  },
  'x-component': 'CollectionFieldset',
  description: '{{t("Fields that are not assigned a value will be set to the default value, and those that do not have a default value are set to null.")}}',
};

export const filter = {
  type: 'object',
  title: '{{t("Filter")}}',
  name: 'config.params.filter',
  'x-decorator': 'FormItem',
  'x-decorator-props': {
    labelAlign: 'left',
    className: css`
      flex-direction: column;
    `
  },
  'x-component': 'Filter',
  'x-component-props': {
    useProps() {
      const { values } = useForm();
      const options = useCollectionFilterOptions(values.config?.collection);
      return {
        options,
        className: css`
          position: relative;
          width: 100%;
        `
      };
    },
    dynamicComponent: 'VariableComponent'
  }
};
