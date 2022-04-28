import { css } from "@emotion/css";
import { useForm } from "@formily/react";
import { useCollectionManager } from "../../collection-manager";
import { useCollectionFilterOptions } from "../../collection-manager/action-hooks";

export const collection = {
  type: 'string',
  title: '数据表',
  name: 'config.collection',
  required: true,
  'x-reactions': ['{{useCollectionDataSource()}}'],
  'x-decorator': 'FormItem',
  'x-component': 'Select',
};

export const values = {
  type: 'object',
  title: '数据内容',
  name: 'config.params.values',
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
      const { getCollectionFields } = useCollectionManager();
      const { values: form } = useForm();
      const fields = getCollectionFields(form?.config?.collection)
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? !field.uiSchema['x-read-pretty'] : false)
        ));
      return { fields };
    }
  }
};

export const filter = {
  type: 'object',
  title: '筛选条件',
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
