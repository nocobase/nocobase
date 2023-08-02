# v0.13：更新说明

## 升级操作

```bash
yarn clean
yarn install
yarn build
```

## 不兼容的变化

### 插件 commonjs 引入去除 `.default`

```diff
- require('./console').default
+ require('./console')
```

不过还是建议最好改为 esm 的引入方式：

```diff
- require('./console').default
+ import Console from './console';
```

### 不要直接从具体的产物格式内引入

如果直接从 `ahooks/es/useRequest` 引入，那么在 commonjs 格式下会报错：

```diff
- import { default as useReq } from 'ahooks/es/useRequest';
+ import { useRequest as useReq } from 'ahooks';
```

如果确实需要引入具体的产物格式，那么可以这样：

```diff
import { default as useReq } from 'ahooks/es/useRequest';

+ const useReqVal = useReq.default || useReq;
- useReq({})
+ useReqVal({})
```
