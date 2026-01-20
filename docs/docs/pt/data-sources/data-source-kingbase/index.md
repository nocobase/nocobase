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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # Chave do aplicativo para gerar tokens de usuário, etc.
      # Se o APP_KEY for alterado, os tokens antigos serão invalidados.
      # Use uma string aleatória e mantenha-a confidencial.
      - APP_KEY=your-secret-key
      # Tipo de banco de dados
      - DB_DIALECT=kingbase
      # Host do banco de dados, pode ser substituído pelo IP de um servidor de banco de dados existente.
      - DB_HOST=kingbase
      # Nome do banco de dados
      - DB_DATABASE=kingbase
      # Usuário do banco de dados
      - DB_USER=nocobase
      # Senha do banco de dados
      - DB_PASSWORD=nocobase
      # Fuso horário
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Serviço Kingbase apenas para fins de teste
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
      ENABLE_CI: no # Deve ser definido como no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Apenas pg
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