# v0.15

## Features

## Breaking changes

### Plugin configuration page registration API

Previously, the `SettingsCenterProvider` was used to register the plugin configuration page, for example:

```tsx | pure

const HelloProvider = React.memo((props) => {
  return (
    <SettingsCenterProvider
      settings={{
        'hello': {
          title: 'Hello',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Hello tab',
              component: HelloPluginSettingPage,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
});
```

Now it needs to be changed to:

```tsx | pure
class HelloPlugin extends Plugin {
  async load() {
    this.app.settingsCenter.add('hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: HelloPluginSettingPage,
      // It is not necessary to pass this parameter if it is a new plugin
      aclSnippet: 'pm.hello.tab1',
    });
  }
}
```

If the plugin configuration page has a link jump inside, you need to make the corresponding changes, for example:

```tsx | pure
navigate('/admin/settings/hello/tab1');
```

Now it needs to be:

```tsx | pure
import { useApp } from '@nocobase/client'
const app = useApp();
navigate(app.settingsCenter.getRoutePath('hello')); // 当然也可以直接写 navigate('/admin/settings/hello');
```

For more information, please refer to [Plugin configuration page](/development/client/settings-center).
