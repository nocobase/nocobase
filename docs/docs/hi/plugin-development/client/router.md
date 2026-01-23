:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# राउटर

NocoBase क्लाइंट एक लचीला राउटर मैनेजर प्रदान करता है, जो `router.add()` और `pluginSettingsRouter.add()` का उपयोग करके पेजों और प्लगइन सेटिंग पेजों को एक्सटेंड (विस्तारित) करने में मदद करता है।

## पंजीकृत डिफ़ॉल्ट पेज रूट

| नाम           | पाथ               | कॉम्पोनेंट           | विवरण                     |
| -------------- | ----------------- | ------------------- | -------------------------- |
| admin          | /admin/\*         | AdminLayout         | एडमिन पेज                 |
| admin.page     | /admin/:name      | AdminDynamicPage    | डायनामिक रूप से बनाए गए पेज |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | प्लगइन सेटिंग पेज           |

## नियमित पेज एक्सटेंशन

`router.add()` का उपयोग करके नियमित पेज रूट जोड़ें।

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

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

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

डायनामिक पैरामीटर को सपोर्ट करता है

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## प्लगइन सेटिंग पेज एक्सटेंशन

`pluginSettingsRouter.add()` का उपयोग करके प्लगइन सेटिंग पेज जोड़ें।

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // सेटिंग पेज का शीर्षक
      icon: 'ApiOutlined', // सेटिंग पेज का मेनू आइकन
      Component: HelloSettingPage,
    });
  }
}
```

मल्टी-लेवल रूटिंग का उदाहरण

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // टॉप-लेवल रूट
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // चाइल्ड रूट
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```