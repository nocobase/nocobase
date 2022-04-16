import { css } from "@emotion/css";
import { useForm } from "@formily/react";
import { useCollectionFilterOptions } from "../../collection-manager/action-hooks";

export const collection = {
  type: 'string',
  title: '数据表',
  name: 'collection',
  required: true,
  'x-reactions': ['{{useCollectionDataSource()}}'],
  'x-decorator': 'FormItem',
  'x-component': 'Select',
};

export const values = {
  type: 'object',
  title: '数据内容',
  name: 'values',
  'x-decorator': 'FormItem',
  'x-decorator-props': {
    labelAlign: 'left',
    className: css`
      flex-direction: column;
    `
  },
  'x-component': 'CollectionFieldset',
  'x-component-props': {
    useProps() {
      const { values: form } = useForm();
      const fields = useCollectionFilterOptions(form.collection);
      return { fields };
    }
  }
};

export const filter = {
  type: 'object',
  title: '筛选条件',
  name: 'filter',
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
      const options = useCollectionFilterOptions(values.collection);
      return {
        options,
        className: css`
          position: relative;
          width: 100%;
          padding: .5em 1em;
          border: 1px dashed #ddd;
        `
      };
    },
    dynamicComponent: 'VariableComponent'
  }
};
