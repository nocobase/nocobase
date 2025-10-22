# 扩展通知渠道类型

NocoBase支持按需扩展通知渠道类型，如短信通知，app推送等。

## 客户端

### 渠道类型注册

客户端渠道配置和消息配置界面通过通知管理插件客户端提供的接口`registerChannelType`进行注册：

```ts
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: 'Example SMS', // 渠道类型名称
      type: 'example-sms', // 渠道类型标识
      components: {
        ChannelConfigForm, //渠道配置表单
        MessageConfigForm, //消息配置表单
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

## 服务端

### 继承抽象类

服务端开发的核心是需要继承抽象类`BaseNotificationChannel`并实现`send`方法，`send`方法内部是扩展插件发送通知的业务逻辑

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

### 服务端注册

下面需要调用通知服务端内核的`registerChannelType`方法，将开发好的服务端实现类注册进内核中：

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

## 完整示例

下面以一个通知扩展插件样例来详细描述如何开发一个扩展插件。
假设我们要使用某平台的短信网关为NocoBase增加短信通知功能。

### 插件创建

1. 执行创建插件命令`yarn pm add @nocobase/plugin-notification-example`

### 客户端开发

客户端部分我们需要开发两个form组件，ChannelConfigForm(渠道配置表单) 和MessageConfigForm（消息配置表单）

#### ChannelConfigFrom

某平台发短信时需要APIkey和secret，所以我们的渠道表单内容主要包括以上两项。在`src/client`目录下新建`ChannelConfigForm.tsx`文件，文件内容如下：

```ts
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import useLocalTranslation from './useLocalTranslation';

const ChannelConfigForm = () => {
  const t = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          apiKey: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transport")}}',
            'x-component': 'Input',
          },
          secret: {
            'x-decorator': 'FormItem',
            type: 'string',
            title: '{{t("Transport")}}',
            'x-component': 'Input',
          },
        },
      }}
    />
  );
};

export default ChannelConfigForm;
```

#### MessageConfigForm

消息配置表单，主要包括接收人`receivers`和消息内容`content`的配置。在`src/client`目录下新建`MessageConfigForm.tsx`文件，组件接收`variableOptions`作为变量参数，目前内容表单会在工作流节点配置，一般需要消费工作流节点变量。具体文件内容如下：

```ts
import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import useLocalTranslation from './useLocalTranslation';

const MessageConfigForm = ({ variableOptions }) => {
  const { t } = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          to: {
            type: 'array',
            required: true,
            title: `{{t("Receivers")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                sort: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.SortHandle',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: variableOptions,
                    useTypedConstant: ['string'],
                    placeholder: `{{t("Phone number")}}`,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add phone number")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Content")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.RawTextArea',
            'x-component-props': {
              scope: variableOptions,
              placeholder: 'Hi,',
              autoSize: {
                minRows: 10,
              },
            },
          },
        },
      }}
    />
  );
};

export default MessageConfigForm
```

#### 客户端组件注册

表单配置组件开发好后，需要调用通知管理内核注册，假设我们的平台名称是Example, 则编辑后的`src/client/index.tsx`文件内容如下：

```ts
import { Plugin } from '@nocobase/client';
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';
import { tval } from '@nocobase/utils/client';
import ChannelConfigForm from './ChannelConfigForm';
import MessageConfigForm from './MessageConfigForm';

class PluginNotificationExampleClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: tval('Example SMS', { ns: '@nocobase/plugin-notification-example' }),
      type: 'example-sms',
      components: {
        ChannelConfigForm,
        MessageConfigForm,
      },
    });
  }
}

export default PluginNotificationExampleClient;
```

至此，客户端的开发已经完成

### 服务端开发

服务端开发的核心是需要继承抽象类`BaseNotificationChannel`并实现`send`方法，`send`方法内部是扩展插件发送通知的业务逻辑，这里因为是示例，就简单把接收的参数打印出来。在`src/server`目录下新增文件`example-server.ts`文件，文件内容如下：

```ts
import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';

export class ExampleSever extends BaseNotificationChannel {
  async send(args): Promise<any> {
    console.log('ExampleSever send', args);
    return { status: 'success', message: args.message };
  }
}
```

下面需要调用通知服务端内核的`registerChannelType`方法注册服务端扩展插件，编辑后的`src/clinet/plugin.ts`文件内容如下：

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

### 插件注册启动

1. 执行注册命令`yarn p add @nocobase/plugin-notification-example`
2. 执行启用命令`yarn pm enable @nocobase/plugin-notification-example`

### 渠道配置

此时访问通知管理的渠道页面，可以看到`Example SMS`已被启用
![20241009164207-2024-10-09-16-42-08](https://static-docs.nocobase.com/20241009164207-2024-10-09-16-42-08.png)

新增一个示例渠道
![20250418074409-2025-04-18-07-44-09](https://static-docs.nocobase.com/20250418074409-2025-04-18-07-44-09.png)

新增一个工作流并配置通知节点
![20250418074832-2025-04-18-07-48-32](https://static-docs.nocobase.com/20250418074832-2025-04-18-07-48-32.png)

触发工作流执行，可以看到控制台输出如下信息
![20250418081746-2025-04-18-08-17-48](https://static-docs.nocobase.com/20250418081746-2025-04-18-08-17-48.png)
