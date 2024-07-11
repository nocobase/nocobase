
# DynamicPage

动态页面。

通过读取 URL 的参数，获取 schema，并渲染成页面，如果不存在则渲染 404 页面。

```bash
/page/:pageSchemaUid/tabs/:tabSchemaUid
```

## MobilePage

读取 `pageSchemaUid` 获取页面 schema，渲染成页面。

### Examples

#### Basic

<code src="./demos/pages-dynamic-page-basic.tsx"></code>

#### NotFound

如果 schema 返回未空，则渲染 404 页面。

<code src="./demos/pages-dynamic-page-404.tsx"></code>

### Schema

<code src="./demos/pages-dynamic-page-schema.tsx"></code>

### Settings

<code src="./demos/pages-dynamic-page-settings.tsx"></code>

## MobilePageContext

将页面的配置通过 context 传递给子组件。

```ts
interface MobilePageContextProps {
  /**
   * @default true
   */
  displayPageHeader?: boolean;
  /**
   * @default true
   */
  displayNavigationBar?: boolean;
  /**
   * @default true
   */
  displayPageTitle?: boolean;
  /**
   * @default false
   */
  displayTabs?: boolean;
}
```

- `MobilePageProvider` 提供页面配置
- `useMobilePage` 获取页面配置

## MobilePageContent

读取 `tabSchemaUid` 获取页面 schema，渲染成页面。

### Examples

#### Basic

<code src="./demos/pages-page-content-basic.tsx"></code>

### First route

<code src="./demos/pages-page-content-first-route.tsx"></code>

#### NotFound

如果 schema 返回未空，则渲染 404 页面。

<code src="./demos/pages-page-content-404.tsx"></code>

## MobilePageHeader

页面顶部。

根据页面配置的 `displayPageHeader` 控制是否显示。

### Examples

#### Basic

<code src="./demos/pages-page-header-basic.tsx"></code>

#### displayPageHeader: false

<code src="./demos/pages-page-header-false.tsx"></code>

### MobilePageNavigationBar

页面导航栏。

其会通过 `useMobilePage()` 获取页面配置，并根据配置渲染导航栏。

#### Examples

##### Basic

<code src="./demos/pages-navigation-bar-basic.tsx"></code>

##### displayNavigationBar: false

<code src="./demos/pages-navigation-bar-false.tsx"></code>

##### displayPageTitle: false

<code src="./demos/pages-navigation-bar-title-false.tsx"></code>

#### Schema

不同位置通过 `x-position` 的值控制。

```json
{
  "type": "void",
  "x-component": "MobilePageNavigationBar",
  "properties": {
      "type": "void",
      "x-component": "MobileNavigationActionBar",
      "x-initializer": "mobile:navigation-bar:actions",
      "properties": {
          "action1": {
            "x-position": "right",
            "type": "void",
            "x-component": "Action",
            "x-toolbar": "ActionSchemaToolbar",
            "x-settings": "mobile:navigation-bar:actions:link",
            "x-use-component-props": "useMobileNavigationBarLink",
            "x-component-props": {
                "link": "/",
                "title": "Left",
                "component": "MobileNavigationBarAction"
            }
          },
          "action2": {
            "x-position": "left",
            "type": "void",
            "x-component": "Action",
            "x-toolbar": "ActionSchemaToolbar",
            "x-settings": "mobile:navigation-bar:actions:link",
            "x-use-component-props": "useMobileNavigationBarLink",
            "x-component-props": {
                "link": "/",
                "title": "Right",
                "component": "MobileNavigationBarAction"
            }
          },
          "action3": {
            "x-position": "bottom",
            "type": "void",
            "x-component": "div",
            "x-content": "Bottom"
          }
      },
  }
}
```

<code src="./demos/pages-navigation-bar-actions.tsx"></code>

### MobilePageTabs

用于显示页面 Tabs。

#### Basic

<code src="./demos/pages-page-tabs.tsx"></code>

#### false

<code src="./demos/pages-page-tabs-false.tsx"></code>
