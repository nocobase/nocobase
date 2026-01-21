:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Nasazení v produkčním prostředí

Při nasazování NocoBase v produkčním prostředí může být instalace závislostí poměrně složitá kvůli rozdílům ve způsobech sestavování napříč různými systémy a prostředími. Pro získání plnohodnotného funkčního zážitku doporučujeme nasazení pomocí **Dockeru**. Pokud vaše systémové prostředí nemůže Docker využít, můžete k nasazení použít i **create-nocobase-app**.

:::warning

Nedoporučujeme nasazovat přímo ze zdrojového kódu v produkčním prostředí. Zdrojový kód má mnoho závislostí, je objemný a plná kompilace má vysoké nároky na CPU a paměť. Pokud přesto potřebujete nasadit ze zdrojového kódu, doporučujeme nejprve sestavit vlastní Docker image a poté jej nasadit.

:::

## Proces nasazení

Pro nasazení v produkčním prostředí se můžete řídit stávajícími kroky instalace a aktualizace.

### Nová instalace

- [Instalace Dockeru](../installation/docker.mdx)
- [Instalace create-nocobase-app](../installation/create-nocobase-app.mdx)

### Aktualizace aplikace

- [Aktualizace instalace Dockeru](../installation/docker.mdx)
- [Aktualizace instalace create-nocobase-app](../installation/create-nocobase-app.mdx)

### Instalace a aktualizace pluginů třetích stran

- [Instalace a aktualizace pluginů](../install-upgrade-plugins.mdx)

## Proxy pro statické zdroje

V produkčním prostředí se doporučuje spravovat statické zdroje pomocí proxy serveru, například:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Běžné provozní příkazy

V závislosti na způsobu instalace můžete k správě procesu NocoBase použít následující příkazy:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)