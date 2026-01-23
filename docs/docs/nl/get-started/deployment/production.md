:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Implementatie in Productieomgeving

Wanneer u NocoBase implementeert in een productieomgeving, kan het installeren van afhankelijkheden omslachtig zijn vanwege de uiteenlopende opbouwmethoden van verschillende systemen en omgevingen. Voor een complete functionele ervaring raden wij aan om NocoBase te implementeren met **Docker**. Als uw systeemomgeving geen Docker kan gebruiken, kunt u ook implementeren met **create-nocobase-app**.

:::warning

Het wordt afgeraden om NocoBase direct vanuit de broncode te implementeren in een productieomgeving. De broncode heeft veel afhankelijkheden, is omvangrijk en een volledige compilatie stelt hoge eisen aan CPU en geheugen. Als u toch vanuit de broncode wilt implementeren, wordt aangeraden om eerst een aangepaste Docker-image te bouwen en deze vervolgens te implementeren.

:::

## Implementatieproces

Voor de implementatie in een productieomgeving kunt u de bestaande installatie- en upgradestappen raadplegen.

### Nieuwe Installatie

- [Docker-installatie](../installation/docker.mdx)
- [create-nocobase-app-installatie](../installation/create-nocobase-app.mdx)

### Applicatie Upgraden

- [Een Docker-installatie upgraden](../installation/docker.mdx)
- [Een create-nocobase-app-installatie upgraden](../installation/create-nocobase-app.mdx)

### Externe Plugins Installeren en Upgraden

- [Plugins installeren en upgraden](../install-upgrade-plugins.mdx)

## Proxy voor Statische Bestanden

In een productieomgeving wordt aangeraden om statische bestanden te laten beheren door een proxyserver, bijvoorbeeld:

- [nginx](./static-resource-proxy/nginx.md)
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Veelgebruikte Beheercommando's

Afhankelijk van de installatiemethode kunt u de volgende commando's gebruiken om het NocoBase-proces te beheren:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)