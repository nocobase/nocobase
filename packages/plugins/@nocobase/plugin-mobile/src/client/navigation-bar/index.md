# NavigationBar

## Schema

```ts
{
  'x-component': 'MobileNavigationBar',
  'x-initializer': 'MobileNavigationBar:initializer',
  'x-use-component-props': 'useMobileNavigationBar',
  properties: {
    'back': {
      type: 'void',
      'x-component': 'MobileNavigationBar.Back',
      'x-settings': 'common:settings:remove',
      'x-align': 'left',
    },
    'home': {
      type: 'void',
      'x-component': 'MobileNavigationBar.Home',
      'x-settings': 'common:settings:remove',
      'x-align': 'left',
    },
    'notify': {
      type: 'void',
      'x-component': 'MobileNavigationBar.Link',
      'x-settings': 'MobileNavigationBar.Link:settings',
      'x-align': 'right',
    }
  }
}
```

### MobileNavigationBar

```tsx | pure
interface MobileNavigationBarProps {
  enableTitle?: boolean;
  enableTabs?: boolean;
  backgroundColor?: string;
  color?: string;
}
```


### useMobileNavigationBar

```ts
type useMobileNavigationBar = () => Pick<MobileNavigationBarProps, 'enableTitle' | 'enableTabs'>;
```
