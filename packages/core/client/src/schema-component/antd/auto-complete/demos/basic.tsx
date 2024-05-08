/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
