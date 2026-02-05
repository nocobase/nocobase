:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# स्टोरेज

## अवलोकन

`Storage` क्लास का उपयोग क्लाइंट-साइड जानकारी को स्टोर करने के लिए किया जाता है, और यह डिफ़ॉल्ट रूप से `localStorage` का उपयोग करती है।

### मूल उपयोग

```ts
export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class CustomStorage extends Storage {
  // ...
}
```

## क्लास मेथड्स

### `setItem()`

सामग्री को स्टोर करता है।

#### सिग्नेचर

- `setItem(key: string, value: string): void`

### `getItem()`

सामग्री प्राप्त करता है।

#### सिग्नेचर

- `getItem(key: string): string | null`

### `removeItem()`

सामग्री हटाता है।

#### सिग्नेचर

- `removeItem(key: string): void`

### `clear()`

सभी सामग्री को साफ़ करता है।

#### सिग्नेचर

- `clear(): void`