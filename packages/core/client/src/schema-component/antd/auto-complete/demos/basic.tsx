import { useField } from '@formily/react';
import { getAppComponent } from '@nocobase/test/web';

const mockVal = (str: string, repeat = 1) => ({
  value: str.repeat(repeat),
});
const getPanelValue = (searchText: string) =>
  !searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)];

function useAutoCompleteProps() {
  const field = useField<any>();

  return {
    onSearch(text: string) {
      field.dataSource = getPanelValue(text);
    },
  };
}

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'boolean',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'AutoComplete',
        'x-use-component-props': useAutoCompleteProps,
      },
    },
  },
});

export default App;
