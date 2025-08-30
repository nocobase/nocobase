# 字段

`Form` 的 `initialValues` 实际上是表单值，并不是初始值，初始值是 `Form.Item` 的 `initialValue`

### 示例一：同时有 initialValues 和 initialValue

同时有 Form.initialValues 和 Form.Item initialValue 时，以 Form 的为准。

<code src="./demos/initial-value1.tsx"></code>

### 示例二：只有 initialValue

<code src="./demos/initial-value2.tsx"></code>

### 示例三：使用 joi 验证

<code src="./demos/joi.tsx"></code>

<code src="./demos/form-list.tsx"></code>

<code src="./demos/normalize.tsx"></code>

<code src="./demos/disabled.tsx"></code>


```tsx
import React from 'react';

import { Button, Select, Space, Tag } from 'antd';
import type { SelectProps } from 'antd';

type TagRender = SelectProps['tagRender'];

const options: SelectProps['options'] = [
  { value: 'blue' },
  { value: 'lime' },
  { value: 'green' },
  { value: 'cyan' },
];

const tagRender: TagRender = (props) => {
  const { label, value, onClose } = props;
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <Tag
      color={value}
      onMouseDown={onPreventMouseDown}
      // closable={closable}
      onClose={onClose}
      style={{ marginInlineEnd: 4 }}
    >
      {label}
    </Tag>
  );
};

const App: React.FC = () => (
  <Space.Compact>
    <Select
      mode="multiple"
      suffixIcon={false}
      open={false}
      tagRender={tagRender}
      defaultValue={['blue']}
      style={{ width: '100%' }}
      options={options}
      allowClear
    />
    <Button
      style={{
        fontStyle: 'italic',
        fontFamily: '"New York", "Times New Roman", Times, serif',
      }}
      type={'primary'}
    >
      x
    </Button>
  </Space.Compact>
);

export default App;
```