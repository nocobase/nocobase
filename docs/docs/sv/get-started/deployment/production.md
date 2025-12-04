:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Driftsättning i produktionsmiljö

När ni driftsätter NocoBase i en produktionsmiljö kan installationen av beroenden vara omständlig på grund av skillnader i byggmetoder mellan olika system och miljöer. För en komplett funktionsupplevelse rekommenderar vi att ni driftsätter med **Docker**. Om er systemmiljö inte kan använda Docker, kan ni även driftsätta med **create-nocobase-app**.

:::warning

Vi rekommenderar inte att ni driftsätter direkt från källkod i en produktionsmiljö. Källkoden har många beroenden, är omfattande, och en fullständig kompilering ställer höga krav på CPU och minne. Om ni absolut måste driftsätta från källkod, rekommenderas det att ni först bygger en anpassad Docker-avbildning och sedan driftsätter den.

:::

## Driftsättningsprocess

För driftsättning i produktionsmiljö kan ni följa de befintliga installations- och uppgraderingsstegen.

### Nyinstallation

- [Docker-installation](../installation/docker.mdx)
- [create-nocobase-app-installation](../installation/create-nocobase-app.mdx)

### Uppgradera applikationen

- [Uppgradera en Docker-installation](../installation/docker.mdx)
- [Uppgradera en create-nocobase-app-installation](../installation/create-nocobase-app.mdx)

### Installation och uppgradering av tredjeparts-plugin

- [Installera och uppgradera plugin](../install-upgrade-plugins.mdx)

## Statisk resursproxy

I en produktionsmiljö rekommenderas det att ni hanterar statiska resurser med en proxyserver, till exempel:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Vanliga driftkommandon

Beroende på installationsmetod kan ni använda följande kommandon för att hantera NocoBase-processen:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)