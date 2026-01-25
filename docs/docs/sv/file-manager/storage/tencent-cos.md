:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Tencent Cloud COS

En lagringsmotor baserad på Tencent Cloud COS. Innan ni kan använda den behöver ni förbereda relevanta konton och behörigheter.

## Konfigurationsparametrar

![Exempel på konfiguration av Tencent COS-lagringsmotor](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tips}
Endast de specifika parametrarna för Tencent Cloud COS-lagringsmotorn presenteras här. För allmänna parametrar, se [Allmänna motorparametrar](./index.md#allmänna-motorparametrar).
:::

### Region

Ange regionen för COS-lagringen, till exempel: `ap-chengdu`.

:::info{title=Tips}
Ni kan se regioninformationen för er bucket i [Tencent Cloud COS-konsolen](https://console.cloud.tencent.com/cos). Ni behöver bara använda regionprefixet (inte hela domännamnet).
:::

### SecretId

Ange ID för er Tencent Cloud-åtkomstnyckel.

### SecretKey

Ange Secret för er Tencent Cloud-åtkomstnyckel.

### Bucket

Ange namnet på COS-bucketen, till exempel: `qing-cdn-1234189398`.