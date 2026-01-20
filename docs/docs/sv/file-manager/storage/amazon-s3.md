:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Lagringsmotor: Amazon S3

En lagringsmotor baserad på Amazon S3. Innan ni kan använda den behöver ni förbereda ett konto och relevanta behörigheter.

## Konfigurationsparametrar

![Exempel på konfiguration av Amazon S3-lagringsmotor](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Tips}
Det här avsnittet beskriver endast de specifika parametrarna för Amazon S3-lagringsmotorn. För allmänna parametrar, se [Allmänna motorparametrar](./index#引擎通用参数).
:::

### Region

Ange S3-lagringsregionen, till exempel: `us-west-1`.

:::info{title=Tips}
Ni kan se regioninformationen för er lagringshink i [Amazon S3-konsolen](https://console.aws.amazon.com/s3/). Ni behöver bara ange regionprefixet (inte hela domännamnet).
:::

### AccessKey ID

Ange Amazon S3 AccessKey ID.

### AccessKey Secret

Ange Amazon S3 AccessKey Secret.

### Lagringshink

Ange namnet på S3-lagringshinken.