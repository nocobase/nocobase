---
pkg: "@nocobase/plugin-data-source-kingbase"
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/data-sources/data-source-kingbase/index).
:::

# Fonte de dados - KingbaseES (人大金仓)

## Introdução

Use o banco de dados KingbaseES (人大金仓) como fonte de dados, podendo ser utilizado como banco de dados principal ou como banco de dados externo.

:::warning
Atualmente, apenas o banco de dados KingbaseES (人大金仓) operando no modo pg é suportado.
:::

## Instalação

### Como banco de dados principal

O processo de instalação refere-se à documentação de instalação, a diferença reside principalmente nas variáveis de ambiente.

#### Variáveis de ambiente

Modifique o arquivo .env para adicionar ou modificar as seguintes configurações de variáveis de ambiente relacionadas:

```bash
# Ajuste os parâmetros de DB de acordo com a situação real
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalação Docker

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Instalação usando create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Como banco de dados externo

Execute o comando de instalação ou atualização

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Ativar o plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Manual de uso

- Banco de dados principal: consulte Fonte de dados principal
- Banco de dados externo: consulte [Fonte de dados / Banco de dados externo](/data-sources/data-source-manager/external-database)