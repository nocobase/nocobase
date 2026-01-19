:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# APIClient

## ภาพรวม

`APIClient` เป็น wrapper ที่พัฒนาขึ้นโดยใช้ <a href="https://axios-http.com/" target="_blank">`axios`</a> เป็นพื้นฐานครับ/ค่ะ โดยมีไว้สำหรับใช้ในการเรียกใช้งาน (request) การดำเนินการกับทรัพยากร (resource actions) ของ NocoBase ผ่าน HTTP จากฝั่งไคลเอนต์ครับ/ค่ะ

### การใช้งานเบื้องต้น

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## คุณสมบัติของอินสแตนซ์

### `axios`

อินสแตนซ์ของ `axios` ครับ/ค่ะ ซึ่งคุณสามารถใช้เพื่อเข้าถึง API ของ `axios` ได้ เช่น `apiClient.axios.interceptors` เป็นต้น

### `auth`

คลาสสำหรับการยืนยันตัวตนฝั่งไคลเอนต์ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ [Auth](./auth.md)

### `storage`

คลาสสำหรับการจัดเก็บข้อมูลฝั่งไคลเอนต์ครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ [Storage](./storage.md)

## เมธอดของคลาส

### `constructor()`

คอนสตรักเตอร์ครับ/ค่ะ ใช้สำหรับสร้างอินสแตนซ์ของ `APIClient`

#### รูปแบบการใช้งาน

- `constructor(instance?: APIClientOptions)`

#### ประเภท

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

ใช้สำหรับส่งคำขอ HTTP ครับ/ค่ะ

#### รูปแบบการใช้งาน

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### ประเภท

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### รายละเอียด

##### AxiosRequestConfig

พารามิเตอร์คำขอ `axios` ทั่วไปครับ/ค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

พารามิเตอร์สำหรับคำขอการดำเนินการกับทรัพยากรของ NocoBase ครับ/ค่ะ

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| คุณสมบัติ        | ประเภท     | คำอธิบาย                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. ชื่อทรัพยากร เช่น `a`<br />2. ชื่อออบเจกต์ที่เกี่ยวข้องกับทรัพยากร เช่น `a.b`                                                                |
| `resourceOf`    | `any`    | เมื่อ `resource` เป็นชื่อออบเจกต์ที่เกี่ยวข้องกับทรัพยากร จะหมายถึงค่าคีย์หลัก (primary key) ของทรัพยากรนั้นครับ/ค่ะ เช่น สำหรับ `a.b` จะหมายถึงค่าคีย์หลักของ `a` |
| `action`        | `string` | ชื่อการดำเนินการ (action)                                                                                                                                              |
| `params`        | `any`    | ออบเจกต์พารามิเตอร์สำหรับคำขอ ซึ่งส่วนใหญ่เป็นพารามิเตอร์ URL ครับ/ค่ะ โดยเนื้อหาของคำขอ (request body) จะถูกเก็บไว้ใน `params.values`                                                          |
| `params.values` | `any`    | ออบเจกต์เนื้อหาคำขอ (request body)                                                                                                                                      |

### `resource()`

ใช้สำหรับรับออบเจกต์เมธอดสำหรับการดำเนินการกับทรัพยากรของ NocoBase ครับ/ค่ะ

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

#### รูปแบบการใช้งาน

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### ประเภท

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

#### รายละเอียด

| พารามิเตอร์ | ประเภท                  | คำอธิบาย                                                                                                                                              |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. ชื่อทรัพยากร เช่น `a`<br />2. ชื่อออบเจกต์ที่เกี่ยวข้องกับทรัพยากร เช่น `a.b`                                                                |
| `of`      | `any`                 | เมื่อ `name` เป็นชื่อออบเจกต์ที่เกี่ยวข้องกับทรัพยากร จะหมายถึงค่าคีย์หลัก (primary key) ของทรัพยากรนั้นครับ/ค่ะ เช่น สำหรับ `a.b` จะหมายถึงค่าคีย์หลักของ `a` |
| `headers` | `AxiosRequestHeaders` | HTTP headers ที่จะถูกส่งไปพร้อมกับคำขอการดำเนินการกับทรัพยากรในครั้งถัดไปครับ/ค่ะ                                                                                          |