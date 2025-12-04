:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Lagringsmotor: Aliyun OSS

Detta är en lagringsmotor baserad på Aliyun OSS. Innan ni kan använda den behöver ni förbereda relevanta konton och behörigheter.

## Konfigurationsparametrar

![Exempel på konfiguration av Aliyun OSS lagringsmotor](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Obs}
Detta avsnitt beskriver endast de specifika parametrarna för Aliyun OSS lagringsmotor. För allmänna parametrar, se [Allmänna motorparametrar](./index#引擎通用参数).
:::

### Region

Ange regionen för OSS-lagringen, till exempel: `oss-cn-hangzhou`.

:::info{title=Obs}
Ni kan se regioninformationen för er lagringsyta i [Aliyun OSS-konsolen](https://oss.console.aliyun.com/). Ni behöver endast använda regionprefixet (inte hela domännamnet).
:::

### AccessKey ID

Ange ID för er Aliyun-åtkomstnyckel.

### AccessKey Secret

Ange Secret för er Aliyun-åtkomstnyckel.

### Lagringsyta

Ange namnet på OSS-lagringsytan.

### Tidsgräns

Ange tidsgränsen för uppladdning till Aliyun OSS, i millisekunder. Standardvärdet är `60000` millisekunder (d.v.s. 60 sekunder).