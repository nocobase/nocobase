:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 라우터

NocoBase 클라이언트는 유연한 라우터 관리자를 제공하며, `router.add()`와 `pluginSettingsManager`를 통해 페이지 및 플러그인 설정 페이지를 확장할 수 있도록 지원합니다.

## 등록된 기본 페이지 라우트

| 이름           | 경로               | 컴포넌트                | 설명 |
| -------------- | ------------------ | ------------------- |---------|
| admin          | /admin/\*          | AdminLayout         | 관리자 페이지  |
| admin.page     | /admin/:name       | AdminDynamicPage    | 동적으로 생성된 페이지 |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | 플러그인 설정 페이지  |

## 일반 페이지 확장

`router.add()`를 사용해 일반 페이지 라우트를 추가합니다. 페이지 컴포넌트는 `componentLoader`를 사용해 필요할 때 등록해야 하며, 이렇게 하면 해당 라우트에 실제로 진입할 때만 페이지 모듈이 로드됩니다.

페이지 파일은 `export default`를 사용해야 합니다.

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', {
      path: '/',
      // 동적 가져오기: 이 라우트에 진입할 때만 페이지 모듈이 로드됩니다
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

동적 파라미터 지원

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

페이지가 무겁거나 첫 렌더링에 필요하지 않다면 `componentLoader`를 우선해서 사용하세요. `element`는 레이아웃 라우트나 매우 가벼운 인라인 페이지에 여전히 적합합니다.

## 플러그인 설정 페이지 확장

Register plugin settings pages via `this.pluginSettingsManager`. Registration has two steps — first use `addMenuItem()` to register the menu entry, then use `addPageTabItem()` to register the actual page. Settings pages appear in the NocoBase "Plugin Settings" menu.

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

To add multiple sub-pages under a single menu entry, register multiple `addPageTabItem` calls with the same `menuKey` — tabs will appear automatically:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```