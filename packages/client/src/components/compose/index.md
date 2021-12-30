---
group:
  path: /client
---

# compose

```tsx
import React from 'react';
import { compose } from '..';

const A: React.FC = (props) => <div><h1>A</h1>{props.children}</div>;

export default compose(A)();
```

```tsx
import React from 'react';
import { compose } from '..';

const A: React.FC = (props) => <div><h1>A</h1>{props.children}</div>;
const B: React.FC = (props) => <div><h1>B</h1>{props.children}</div>;

export default compose(A)(B);
```

```tsx
import React from 'react';
import { compose } from '..';

const A: React.FC = (props) => <div><h1>A</h1>{props.children}</div>;
const B: React.FC = (props) => <div><h1>B</h1>{props.children}</div>;
const C: React.FC = (props) => <div><h1>C</h1>{props.children}</div>;

export default compose(A, B)(C);
```

```tsx
import React from 'react';
import { compose } from '..';

const A: React.FC = (props) => <div><h1>A {props.name}</h1>{props.children}</div>;
const B: React.FC = (props) => <div><h1>B {props.name}</h1>{props.children}</div>;
const C: React.FC = (props) => <div><h1>C</h1>{props.children}</div>;

export default compose(A, [B, { name: '1' }])(C);
```

<code src="./demos/demo1.tsx"/>