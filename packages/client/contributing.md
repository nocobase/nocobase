---
toc: menu
---

# 参与贡献

客户端的模块都在 `src` 目录下，各自模块独立。

## 客户端模块

最小单元模块化，一个完整的模块包含：

```bash
|- /__tests__/ # 测试文件目录
|- /demos/ # demo 目录
|- index.ts # 最好不要直接在 index.ts 文件里写代码，index 文件只负责 export
|- index.md # 文档，默认为英文
|- index.zh-CN.md # 中文文档，可缺失，可以先都写到 index.md 里
```

## 测试

详细文档见 [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)

```tsx | pure
import React from 'react';
import { render } from '@testing-library/react';
import { compose } from '../';

describe('compose', () => {
  it('case 1', () => {
    const A: React.FC = (props) => (
      <div>
        <h1>A</h1>
        {props.children}
      </div>
    );
    const App = compose(A)();
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
```

## Demo

组件 Demo 见 [dumi](https://d.umijs.org/guide/basic#write-component-demo)，可以直接写在文档里，如：

<pre lang="markdown">
```jsx
import React from 'react';

export default () => <h1>Hello NocoBase!</h1>;
```
</pre>

也可以引用 demo 文件

```markdown
<code src="./demos/dmeo1.tsx"/>
```
