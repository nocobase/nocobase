:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Tencent COS

Een opslag-engine gebaseerd op Tencent Cloud COS. Voordat u deze gebruikt, dient u de benodigde accounts en machtigingen voor te bereiden.

## Configuratie-opties

![Voorbeeld van Tencent COS configuratie-opties](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tip}
Deze sectie behandelt alleen de specifieke opties voor de Tencent Cloud COS opslag-engine. Voor algemene parameters verwijzen we u naar [Algemene engine-parameters](./index.md#common-engine-parameters).
:::

### Regio

Vul de regio van de COS-opslag in, bijvoorbeeld: `ap-chengdu`.

:::info{title=Tip}
U kunt de regio-informatie van de opslag-bucket bekijken in de [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos). U hoeft alleen het voorvoegsel van de regio te gebruiken (het volledige domein is niet nodig).
:::

### SecretId

Vul de ID in van de geautoriseerde toegangssleutel van Tencent Cloud.

### SecretKey

Vul het geheim in van de geautoriseerde toegangssleutel van Tencent Cloud.

### Bucket

Vul de naam van de COS-bucket in, bijvoorbeeld: `qing-cdn-1234189398`.