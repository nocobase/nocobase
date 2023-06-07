---
nav:
  path: /client
group:
  path: /client
---

# Icon

```tsx | pure
import { Icon } from '@nocobase/client';

Icon.createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js',
});

<Icon type="BookOutlined" />
```

## Examples

Use @ant-design/icons

<code src="./demos/antd-icon.tsx"></code>

Use iconfont.cn

<code src="./demos/iconfont.tsx"/>

Custom Icon

<code src="./demos/custom-icon.tsx"/>

Register Icon

<code src="./demos/register-icon.tsx"/>
