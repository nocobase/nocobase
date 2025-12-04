:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wdrożenie w środowisku produkcyjnym

Podczas wdrażania NocoBase w środowisku produkcyjnym, instalacja zależności może być kłopotliwa ze względu na różnice w metodach budowania w różnych systemach i środowiskach. Aby zapewnić pełne doświadczenie funkcjonalne, zalecamy wdrożenie za pomocą **Docker**. Jeśli środowisko systemowe nie pozwala na użycie Dockera, mogą Państwo również wdrożyć aplikację za pomocą **create-nocobase-app**.

:::warning

Nie zaleca się bezpośredniego wdrażania z kodu źródłowego w środowisku produkcyjnym. Kod źródłowy ma wiele zależności, jest duży objętościowo, a pełna kompilacja wymaga wysokich zasobów CPU i pamięci. Jeśli jednak muszą Państwo wdrożyć aplikację z kodu źródłowego, zaleca się najpierw zbudowanie niestandardowego obrazu Dockera, a następnie jego wdrożenie.

:::

## Proces wdrażania

W celu wdrożenia w środowisku produkcyjnym mogą Państwo zapoznać się z istniejącymi krokami instalacji i aktualizacji.

### Nowa instalacja

- [Instalacja Docker](../installation/docker.mdx)
- [Instalacja create-nocobase-app](../installation/create-nocobase-app.mdx)

### Aktualizacja aplikacji

- [Aktualizacja instalacji Docker](../installation/docker.mdx)
- [Aktualizacja instalacji create-nocobase-app](../installation/create-nocobase-app.mdx)

### Instalacja i aktualizacja wtyczek innych firm

- [Instalacja i aktualizacja wtyczek](../install-upgrade-plugins.mdx)

## Serwer proxy zasobów statycznych

W środowisku produkcyjnym zaleca się zarządzanie zasobami statycznymi za pomocą serwera proxy, na przykład:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Często używane polecenia operacyjne

W zależności od metody instalacji, mogą Państwo użyć następujących poleceń do zarządzania procesem NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)