:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel लाइफ़साइकिल

## model मेथड्स

आंतरिक कॉल

```ts
class MyModel extends FlowModel {
  onInit() {}
  onMount() {}
  useHooksBeforeRender() {}
  render() {}
  onUnMount() {}
  onDispatchEventStart() {}
  onDispatchEventEnd() {}
  onDispatchEventError() {}
}
```

## model.emitter

बाहरी ट्रिगर्स के लिए

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## प्रक्रिया

1. मॉडल बनाना
    - onInit
2. मॉडल रेंडर करना
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. कॉम्पोनेंट अनमाउंट करना
    - onUnMount
4. फ़्लो ट्रिगर करना
    - onDispatchEventStart
    - onDispatchEventEnd
5. री-रेंडर करना
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount