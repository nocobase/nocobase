:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowEngine और प्लगइन का संबंध

**FlowEngine** कोई प्लगइन नहीं है, बल्कि यह एक **कोर API** है जिसे प्लगइन के उपयोग के लिए प्रदान किया जाता है। इसका उद्देश्य कोर क्षमताओं को व्यावसायिक विस्तारों से जोड़ना है। NocoBase 2.0 में, सभी API FlowEngine में केंद्रीकृत हैं, और प्लगइन `this.engine` के माध्यम से FlowEngine तक पहुँच सकते हैं।

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: केंद्रीकृत रूप से प्रबंधित वैश्विक क्षमताएँ

FlowEngine एक केंद्रीकृत **Context** प्रदान करता है, जो विभिन्न परिदृश्यों के लिए आवश्यक API को एक साथ लाता है, उदाहरण के लिए:

```ts
class PluginHello extends Plugin {
  async load() {
    // राउटर विस्तार
    this.engine.context.router;

    // एक अनुरोध करें
    this.engine.context.api.request();

    // i18n से संबंधित
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **ध्यान दें**:
> Context ने 2.0 में 1.x की निम्नलिखित समस्याओं को हल किया है:
>
> * संदर्भ का बिखरा होना, असंगत कॉल
> * विभिन्न React रेंडर ट्री के बीच संदर्भ का खो जाना
> * केवल React घटकों के भीतर ही उपयोग किया जा सकता है
>
> अधिक जानकारी के लिए, **FlowContext अध्याय** देखें।

---

## प्लगइन में शॉर्टकट उपनाम

कॉल को सरल बनाने के लिए, FlowEngine प्लगइन इंस्टेंस पर कुछ उपनाम प्रदान करता है:

* `this.context` → `this.engine.context` के समतुल्य
* `this.router` → `this.engine.context.router` के समतुल्य

## उदाहरण: राउटर का विस्तार करना

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

इस उदाहरण में:

* प्लगइन ने `this.router.add` विधि का उपयोग करके `/` पाथ के लिए राउटर का विस्तार किया है;
* `createMockClient` एक स्वच्छ मॉक एप्लिकेशन प्रदान करता है, जो आसान प्रदर्शन और परीक्षण के लिए उपयोगी है;
* `app.getRootComponent()` रूट घटक को वापस करता है, जिसे सीधे पेज पर माउंट किया जा सकता है।