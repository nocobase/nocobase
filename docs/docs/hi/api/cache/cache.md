:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# कैश

## बुनियादी तरीके

आप <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> के दस्तावेज़ देख सकते हैं।

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## अन्य तरीके

### `wrapWithCondition()`

यह `wrap()` के समान है, लेकिन आप शर्त के आधार पर तय कर सकते हैं कि कैश का उपयोग करना है या नहीं।

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // बाहरी पैरामीटर यह नियंत्रित करने के लिए कि कैश किए गए परिणाम का उपयोग करना है या नहीं
    useCache?: boolean;
    // डेटा परिणाम के आधार पर तय करें कि कैश करना है या नहीं
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

जब कैश की गई सामग्री एक ऑब्जेक्ट हो, तो किसी विशिष्ट कुंजी (key) का मान (value) बदलें।

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

जब कैश की गई सामग्री एक ऑब्जेक्ट हो, तो किसी विशिष्ट कुंजी (key) का मान (value) प्राप्त करें।

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

जब कैश की गई सामग्री एक ऑब्जेक्ट हो, तो किसी विशिष्ट कुंजी (key) को हटाएँ।

```ts
async delValueInObject(key: string, objectKey: string)
```