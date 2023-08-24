# v0.13：Update instructions


## Upgrade operation

```bash
yarn clean
yarn install
yarn build
```

## Break changes

### Remove `.default` from commonjs import

```diff
- require('./console').default
+ require('./console')
```

But it is still recommended to use esm import:

```diff
- require('./console').default
+ import Console from './console';
```

### Do not import directly from the specific product format

If you import directly from `ahooks/es/useRequest`, it will report an error in commonjs format:

```diff
- import { default as useReq } from 'ahooks/es/useRequest';
+ import { useRequest as useReq } from 'ahooks';
```

If you do need to import the specific product format, you can do this:

```diff
import { default as useReq } from 'ahooks/es/useRequest';

+ const useReqVal = useReq.default || useReq;
- useReq({})
+ useReqVal({})
```
