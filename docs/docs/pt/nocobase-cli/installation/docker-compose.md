#Instalar via Docker Compose

Se você deseja executar o NocoBase diretamente no servidor, `docker compose` ainda é o caminho mais direto. Uma porção de `docker-compose.yml` é suficiente para a maioria dos cenários.

Porém, em um ambiente de produção, é recomendável corrigir o número de versão específico e não usar `latest` diretamente por um longo período. Isso tornará a atualização mais controlável.

## Pré-requisitos

- Docker e Docker Compose instalados
- Certifique-se de que o serviço Docker esteja iniciado
- Foi preparada uma porta para ser aberta ao mundo exterior, como `13000`

## Etapa 1: Crie o diretório do projeto

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Etapa 2: Criar `docker-compose.yml`

O exemplo a seguir usa PostgreSQL, que também é a combinação mais despreocupada por padrão:

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

em:

- `APP_KEY` Lembre-se de alterá-lo para sua própria string aleatória
- `13000:80` representa o mapeamento da porta `13000` do host para a porta `80` do contêiner
- Se você já possui um serviço de banco de dados, pode excluir a seção `postgres` e alterar `DB_HOST` para o endereço do banco de dados existente

Se você usa MySQL ou MariaDB, lembre-se de alterar `DB_DIALECT` para o tipo correspondente e adicionar:

```bash
DB_UNDERSCORED=true
```

## Etapa 3: inicie o aplicativo

```bash
docker compose up -d
```

Verifique o registro:

```bash
docker compose logs -f app
```

## Passo 4: Acesse o aplicativo

Depois que o aplicativo for iniciado, abra:

```text
http://<服务器IP>:13000
```

Se for a primeira vez que inicia, basta seguir as instruções da página para inicializar a conta de administrador.

## Comandos comuns

Inicie ou atualize contêineres:

```bash
docker compose up -d
```

Parar aplicação:

```bash
docker compose down
```

Verifique o registro:

```bash
docker compose logs -f app
```

## Onde procurar em seguida

- Se você deseja ajustar a configuração de chaves, portas, bancos de dados, etc., continue em [Variáveis de ambiente de aplicação](./env.md)
- Se você está pronto para entrar oficialmente online, continue lendo [Nginx](../production/reverse-proxy/nginx.md) ou [Caddy](../production/reverse-proxy/caddy.md)
- Se você quiser fazer backup dos dados mais tarde, continue em [Backup e Restauração](../operations/backup-restore.md)
