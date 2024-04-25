import { getAppComponent } from '@nocobase/test/web';
import React, { useEffect, useState } from 'react';
import { useField } from '@formily/react';
import { Cascader, withDynamicSchemaProps } from '@nocobase/client';

interface Option {
  value?: string | number | null;
  label: React.ReactNode;
  children?: Option[];
  isLeaf?: boolean;
}

const optionLists: Option[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    isLeaf: false,
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    isLeaf: false,
  },
];

const useCustomCascaderProps = () => {
  const [options, setOptions] = useState<Option[]>(optionLists);
  const field = useField<any>();

  field.dataSource = options;

  const onChange = (value: (string | number)[], selectedOptions: Option[]) => {
    console.log(value, selectedOptions);
  };

  const loadData = (selectedOptions: Option[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];

    // load options lazily
    setTimeout(() => {
      targetOption.children = [
        {
          label: `${targetOption.label} Dynamic 1`,
          value: 'dynamic1',
        },
        {
          label: `${targetOption.label} Dynamic 2`,
          value: 'dynamic2',
        },
      ];
      setOptions([...options]);
    }, 1000);
  };

  return {
    changeOnSelect: true,
    onChange,
    loadData,
  };
};

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'string',
        title: 'Test title',
        'x-decorator': 'FormItem',
        'x-component': 'Cascader11',
        'x-use-component-props': 'useCustomCascaderProps',
      },
    },
  },
  appOptions: {
    components: {
      Cascader11: withDynamicSchemaProps(Cascader, { displayName: 'Cascader' }),
    },
    scopes: {
      useCustomCascaderProps,
    },
  },
});

export default App;
