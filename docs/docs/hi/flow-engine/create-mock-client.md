:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# createMockClient

उदाहरणों और परीक्षणों के लिए, `createMockClient` का उपयोग करके एक मॉक एप्लिकेशन को तेज़ी से बनाना आमतौर पर सुझाया जाता है। एक मॉक एप्लिकेशन एक साफ़, खाली एप्लिकेशन होता है जिसमें कोई भी प्लगइन सक्रिय नहीं होता है, और यह केवल उदाहरणों और परीक्षणों के लिए होता है।

उदाहरण के लिए:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// उदाहरण और परीक्षण परिदृश्यों के लिए
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` मॉक API डेटा बनाने के लिए `apiMock` प्रदान करता है।

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    const { data } = await this.context.api.request({
      method: 'get',
      url: 'users',
    });
  }
}

// उदाहरण और परीक्षण परिदृश्यों के लिए
const app = createMockClient({
  plugins: [PluginHelloModel],
});

app.apiMock.onGet('users').reply(200, {
  data: {
    id: 1,
    name: 'John Doe',
  },
});

export default app.getRootComponent();
```

`createMockClient` के आधार पर, हम प्लगइन के माध्यम से कार्यक्षमता को तेज़ी से बढ़ा सकते हैं। `Plugin` के लिए सामान्य API में शामिल हैं:

- plugin.router: राउट्स (routes) का विस्तार करें
- plugin.engine: फ्रंटएंड इंजन (NocoBase 2.0)
- plugin.context: कॉन्टेक्स्ट (NocoBase 2.0)

उदाहरण 1: राउटर के माध्यम से एक राउट (route) जोड़ें।

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// उदाहरण और परीक्षण परिदृश्यों के लिए
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

हम बाद के अध्यायों में और अधिक सामग्री प्रस्तुत करेंगे।