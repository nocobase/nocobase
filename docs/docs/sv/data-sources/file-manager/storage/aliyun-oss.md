:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Aliyun OSS

Lagringsmotor baserad på Aliyun OSS. Innan du använder den behöver du förbereda relevanta konton och behörigheter.

## Konfiguration

![Exempel på Aliyun OSS-konfiguration](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Tips}
Här beskrivs endast de specifika parametrarna för Aliyun OSS-lagringsmotorn. För allmänna parametrar, se [Allmänna motorparametrar](./index.md#common-engine-parameters).
:::

### Region

Ange regionen för OSS-lagringen, till exempel: `oss-cn-hangzhou`.

:::info{title=Tips}
Du kan se regioninformationen för lagringsutrymmet i [Aliyun OSS-konsolen](https://oss.console.aliyun.com/). Du behöver bara använda prefixet för regionen (utan hela domännamnet).
:::

### AccessKey ID

Fyll i ID för den auktoriserade åtkomstnyckeln för Alibaba Cloud.

### AccessKey Secret

Fyll i hemligheten (Secret) för den auktoriserade åtkomstnyckeln för Alibaba Cloud.

### Bucket

Fyll i namnet på OSS-bucketen.