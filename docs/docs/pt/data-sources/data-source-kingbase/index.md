---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Fonte de Dados - KingbaseES

## Introdução

Você pode usar o banco de dados KingbaseES como uma **fonte de dados**, seja como o banco de dados principal ou como um banco de dados externo.

:::warning
Atualmente, apenas bancos de dados KingbaseES que operam no modo pg são suportados.
:::

## Instalação

### Usando como Banco de Dados Principal

Para o processo de instalação, consulte a documentação de instalação. A principal diferença estará nas variáveis de ambiente.

#### Variáveis de Ambiente

Edite o arquivo .env para adicionar ou modificar as seguintes configurações de variáveis de ambiente:

```bash
# Ajuste os parâmetros do banco de dados conforme necessário
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalação via Docker

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

#### Instalação Usando create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Usando como Banco de Dados Externo

Execute o comando de instalação ou atualização:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Ative o Plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Guia de Uso

- Banco de Dados Principal: Consulte a [Fonte de dados principal](/data-sources/data-source-main/)
- Banco de Dados Externo: Veja [Fonte de Dados / Banco de Dados Externo](/data-sources/data-source-manager/external-database)