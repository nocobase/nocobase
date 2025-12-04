:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Tencent COS

En lagringsmotor baserad på Tencent Cloud COS. Innan du använder den behöver du förbereda relevanta konton och behörigheter.

## Inställningar

![Exempel på Tencent COS-inställningar](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tips}
Detta avsnitt behandlar endast de specifika inställningarna för Tencent Cloud COS-lagringsmotorn. För allmänna parametrar, se [Allmänna motorparametrar](./index.md#allmänna-motorparametrar).
:::

### Region

Fyll i regionen för COS-lagringen, till exempel: `ap-chengdu`.

:::info{title=Tips}
Du kan se regioninformationen för lagringsutrymmet i [Tencent Cloud COS-konsolen](https://console.cloud.tencent.com/cos). Du behöver bara ange regionens prefix (inte hela domännamnet).
:::

### SecretId

Fyll i ID:t för den auktoriserade Tencent Cloud-åtkomstnyckeln.

### SecretKey

Fyll i Secret för den auktoriserade Tencent Cloud-åtkomstnyckeln.

### Bucket

Fyll i namnet på COS-bucketen, till exempel: `qing-cdn-1234189398`.