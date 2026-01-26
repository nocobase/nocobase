:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# APIक्लाइंट

## अवलोकन

`APIक्लाइंट` <a href="https://axios-http.com/" target="_blank">`axios`</a> पर आधारित एक रैपर है, जिसका उपयोग क्लाइंट-साइड पर HTTP के माध्यम से NocoBase के रिसोर्स ऑपरेशंस का अनुरोध करने के लिए किया जाता है।

### बुनियादी उपयोग

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## इंस्टेंस प्रॉपर्टीज़

### `axios`

यह `axios` इंस्टेंस है, जिसका उपयोग आप `axios` API तक पहुँचने के लिए कर सकते हैं, उदाहरण के लिए, `apiClient.axios.interceptors`.

### `auth`

क्लाइंट-साइड प्रमाणीकरण क्लास, [Auth](./auth.md) देखें।

### `storage`

क्लाइंट-साइड स्टोरेज क्लास, [Storage](./storage.md) देखें।

## क्लास मेथड्स

### `constructor()`

कंस्ट्रक्टर, जो एक `APIक्लाइंट` इंस्टेंस बनाता है।

#### सिग्नेचर

- `constructor(instance?: APIClientOptions)`

#### टाइप

```ts
interface ExtendedOptions {
  authClass?: any;
  storageClass?: any;
}

export type APIClientOptions =
  | AxiosInstance
  | (AxiosRequestConfig & ExtendedOptions);
```

### `request()`

एक HTTP अनुरोध शुरू करता है।

#### सिग्नेचर

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### टाइप

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### विवरण

##### AxiosRequestConfig

सामान्य axios अनुरोध पैरामीटर। <a href="https://axios-http.com/docs/req_config" target="_blank">अनुरोध कॉन्फ़िग</a> देखें।

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase रिसोर्स एक्शन अनुरोध पैरामीटर।

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| प्रॉपर्टी        | टाइप     | विवरण                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. रिसोर्स का नाम, जैसे `a`<br />2. रिसोर्स के संबंधित ऑब्जेक्ट का नाम, जैसे `a.b`                                                                |
| `resourceOf`    | `any`    | जब `resource` रिसोर्स के संबंधित ऑब्जेक्ट का नाम हो, तो यह रिसोर्स का प्राइमरी की मान होता है। उदाहरण के लिए, `a.b` के लिए, यह `a` के प्राइमरी की मान को दर्शाता है। |
| `action`        | `string` | एक्शन का नाम                                                                                                                                              |
| `params`        | `any`    | अनुरोध पैरामीटर ऑब्जेक्ट, मुख्य रूप से URL पैरामीटर। अनुरोध बॉडी `params.values` में रखी जाती है।                                                          |
| `params.values` | `any`    | अनुरोध बॉडी ऑब्जेक्ट                                                                                                                                      |

### `resource()`

NocoBase रिसोर्स एक्शन मेथड ऑब्जेक्ट प्राप्त करता है।

```ts
const resource = apiClient.resource('users');

await resource.create({
  values: {
    username: 'admin',
  },
});

const res = await resource.list({
  page: 2,
  pageSize: 20,
});
```

#### सिग्नेचर

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### टाइप

```ts
export interface ActionParams {
  filterByTk?: any;
  [key: string]: any;
}

type ResourceAction = (params?: ActionParams) => Promise<any>;

export type IResource = {
  [key: string]: ResourceAction;
};
```

#### विवरण

| पैरामीटर  | टाइप                  | विवरण                                                                                                                                              |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. रिसोर्स का नाम, जैसे `a`<br />2. रिसोर्स के संबंधित ऑब्जेक्ट का नाम, जैसे `a.b`                                                                |
| `of`      | `any`                 | जब `name` रिसोर्स के संबंधित ऑब्जेक्ट का नाम हो, तो यह रिसोर्स का प्राइमरी की मान होता है। उदाहरण के लिए, `a.b` के लिए, यह `a` के प्राइमरी की मान को दर्शाता है। |
| `headers` | `AxiosRequestHeaders` | बाद के रिसोर्स एक्शन अनुरोधों में शामिल करने के लिए HTTP हेडर।                                                                                          |