:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Tencent Cloud COS

Een opslagengine gebaseerd op Tencent Cloud COS. Voordat u deze kunt gebruiken, dient u de benodigde accounts en machtigingen voor te bereiden.

## Configuratieparameters

![Voorbeeld van Tencent COS opslagengine configuratie](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tip}
Deze sectie introduceert alleen de specifieke parameters voor de Tencent Cloud COS opslagengine. Voor algemene parameters, raadpleegt u [Algemene engineparameters](./index.md#general-engine-parameters).
:::

### Regio

Voer de regio in voor COS-opslag, bijvoorbeeld: `ap-chengdu`.

:::info{title=Tip}
U kunt de regio-informatie van uw opslagruimte bekijken in de [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos). U hoeft alleen het regiocodegedeelte te gebruiken (niet de volledige domeinnaam).
:::

### SecretId

Voer de ID van uw Tencent Cloud toegangssleutel in.

### SecretKey

Voer de Secret van uw Tencent Cloud toegangssleutel in.

### Bucket

Voer de naam van de COS-bucket in, bijvoorbeeld: `qing-cdn-1234189398`.