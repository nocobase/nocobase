:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Opslag-engine: Aliyun OSS

De Aliyun OSS opslag-engine vereist dat u vooraf de bijbehorende accounts en machtigingen configureert.

## Configuratieparameters

![Voorbeeld van Aliyun OSS Opslag-engine configuratie](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Tip}
Deze sectie behandelt alleen de specifieke parameters voor de Aliyun OSS opslag-engine. Voor algemene parameters verwijzen wij u naar [Algemene engineparameters](./index#引擎通用参数).
:::

### Regio

Voer de regio van de OSS-opslag in, bijvoorbeeld: `oss-cn-hangzhou`.

:::info{title=Tip}
U kunt de regio-informatie van uw opslagruimte (bucket) bekijken in de [Aliyun OSS Console](https://oss.console.aliyun.com/). U hoeft alleen het regiovooroefsel te gebruiken (de volledige domeinnaam is niet nodig).
:::

### AccessKey ID

Voer de ID in van uw Aliyun toegangssleutel.

### AccessKey Secret

Voer het Secret in van uw Aliyun toegangssleutel.

### Bucket

Voer de naam van de OSS-bucket in.

### Time-out

Voer de time-outduur in voor het uploaden naar Aliyun OSS, in milliseconden. De standaardwaarde is `60000` milliseconden (oftewel 60 seconden).