:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การอ้างอิง API

## ฝั่งเซิร์ฟเวอร์

### `BaseNotificationChannel`

คลาส abstract นี้เป็นคลาสพื้นฐานสำหรับช่องทางการแจ้งเตือนประเภทต่างๆ โดยจะกำหนดอินเทอร์เฟซที่จำเป็นสำหรับการใช้งานช่องทาง หากต้องการเพิ่มช่องทางการแจ้งเตือนใหม่ คุณต้องสืบทอดคลาสนี้และ implement เมธอดต่างๆ ที่อยู่ในคลาสครับ/ค่ะ

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;
}
```

### `PluginNotificationManagerServer`

ปลั๊กอินฝั่งเซิร์ฟเวอร์นี้เป็นเครื่องมือจัดการการแจ้งเตือน โดยมีเมธอดสำหรับลงทะเบียนประเภทช่องทางการแจ้งเตือนและส่งการแจ้งเตือนครับ/ค่ะ

#### `registerChannelType()`

เมธอดนี้ใช้สำหรับลงทะเบียนประเภทช่องทางใหม่บนฝั่งเซิร์ฟเวอร์ครับ/ค่ะ ดูตัวอย่างการใช้งานได้ที่ด้านล่างนี้เลยครับ/ค่ะ

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleSever });
  }
}

export default PluginNotificationExampleServer;
```

##### ซิกเนเจอร์

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

เมธอด `send` ใช้สำหรับส่งการแจ้งเตือนผ่านช่องทางที่ระบุครับ/ค่ะ

```ts
send('in-app-message',
  message:[
    receivers: [1,2,3],
    receiverType: 'userId',
    content: '站内信测试',
    title: '站内信测试标题'
  ],
  triggerFrom: 'workflow')

  send('email',
  message:[
    receivers: ['a@163.com', 'b@163.com'],
    receiverType: 'email',
    content: '邮箱测试',
    title: '邮箱测试标题'
  ],
  triggerFrom: 'workflow')
```

##### ซิกเนเจอร์

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

ฟิลด์ `receivers` ปัจจุบันรองรับสองรูปแบบ ได้แก่ NocoBase user IDs (`userId`) และการกำหนดค่าช่องทางแบบกำหนดเอง (`channel-self-defined`) ครับ/ค่ะ

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### รายละเอียดเพิ่มเติม

`sendConfig`

| คุณสมบัติ         | ประเภท         |  คำอธิบาย       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | ตัวระบุช่องทาง   |
| `message`   | `object`   | ออบเจกต์ข้อความ      |
| `receivers`     | `ReceiversType`  | ผู้รับ |
| `triggerFrom`     | `string`  | แหล่งที่มาของการทริกเกอร์ |

## ฝั่งไคลเอนต์

### `PluginNotificationManagerClient`

#### `channelTypes`

ไลบรารีของประเภทช่องทางที่ลงทะเบียนไว้ครับ/ค่ะ

##### ซิกเนเจอร์

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

ใช้สำหรับลงทะเบียนประเภทช่องทางฝั่งไคลเอนต์ครับ/ค่ะ

##### ซิกเนเจอร์

`registerChannelType(params: registerTypeOptions)`

##### ประเภท

```ts
type registerTypeOptions = {
  title: string; // ชื่อที่แสดงสำหรับช่องทาง
  type: string;  // ตัวระบุช่องทาง
  components: {
    ChannelConfigForm?: ComponentType // คอมโพเนนต์ฟอร์มการกำหนดค่าช่องทาง;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // คอมโพเนนต์ฟอร์มการกำหนดค่าข้อความ;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // คอมโพเนนต์ฟอร์มการกำหนดค่าเนื้อหา (สำหรับเนื้อหาข้อความเท่านั้น ไม่รวมการกำหนดค่าผู้รับ);
  };
  meta?: { // เมตาข้อมูลสำหรับการกำหนดค่าช่องทาง
    createable?: boolean // รองรับการเพิ่มช่องทางใหม่หรือไม่;
    editable?: boolean  // ข้อมูลการกำหนดค่าช่องทางแก้ไขได้หรือไม่;
    deletable?: boolean // ข้อมูลการกำหนดค่าช่องทางลบได้หรือไม่;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```