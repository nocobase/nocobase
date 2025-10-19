# 插件开发

```tsx 
import { createMockClient, Plugin } from '@nocobase/client-v2';
import React from 'react';

class PluginHelloClient extends Plugin {
  async load() {
    // wait 50 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

const app = createMockClient({
  plugins: [PluginHelloClient],
});

export default app.getRootComponent();
```
