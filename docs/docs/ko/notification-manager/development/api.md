:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# API 레퍼런스

## 서버 사이드

### `BaseNotificationChannel`

`BaseNotificationChannel`은 사용자 채널 유형의 추상 클래스입니다. 알림 채널에 필요한 인터페이스를 정의하며, 새로운 알림 채널 유형을 확장하려면 이 클래스를 상속받아 메서드를 구현해야 합니다.

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

`PluginNotificationManagerServer`는 알림 관리 서버 사이드 플러그인입니다. 알림 채널 유형 등록 메서드와 알림 발송 메서드를 제공합니다.

#### `registerChannelType()`

이 메서드는 서버 사이드에서 채널 유형을 등록합니다. 아래 예시를 참고해 주세요.

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

##### 시그니처

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

`send` 메서드는 알림을 발송하는 데 사용됩니다. 이 메서드를 호출하여 알림을 보낼 수 있습니다.

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

##### 시그니처

`send(sendConfig: {channelName:String, message: Object, receivers: ReceiversType, triggerFrom: String })`

`receivers` 필드는 현재 두 가지 형식만 지원합니다: NocoBase 사용자 ID인 `userId`와 채널별 자체 정의 설정인 `channel-self-defined`입니다.

```ts
type ReceiversType = 
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### 상세 정보

`sendConfig`

| 속성         | 타입         |  설명       |
| ------------ | ------------ | --------- |
| `channelName`    | `string` | 채널 식별자   |
| `message`   | `object`   | 메시지 객체      |
| `receivers`     | `ReceiversType`  | 수신자 |
| `triggerFrom`     | `string`  | 트리거 출처 |

## 클라이언트 사이드

### `PluginNotificationManagerClient`

#### `channelTypes`

등록된 채널 유형 라이브러리입니다.

##### 시그니처

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

클라이언트 사이드 채널 유형을 등록합니다.

##### 시그니처

`registerChannelType(params: registerTypeOptions)`

##### 타입

```ts
type registerTypeOptions = {
  title: string; // 채널 표시 제목
  type: string;  // 채널 식별자
  components: {
    ChannelConfigForm?: ComponentType // 채널 설정 폼 컴포넌트;
    MessageConfigForm?: ComponentType<{ variableOptions: any }> // 메시지 설정 폼 컴포넌트;
    ContentConfigForm?: ComponentType<{ variableOptions: any }> // 콘텐츠 설정 폼 컴포넌트 (메시지 내용만 해당하며, 수신자 설정은 포함하지 않음);
  };
  meta?: { // 채널 설정 메타 정보
    createable?: boolean //새 채널 추가 지원 여부;
    editable?: boolean  //채널 설정 정보 편집 가능 여부;
    deletable?: boolean //채널 설정 정보 삭제 가능 여부;
  };
};

type RegisterChannelType = (params: ChannelType) => void
```