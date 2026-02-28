---
pkg: '@nocobase/plugin-app-supervisor'
---

# Modo multiambiente

## Introdução

Quando o modo de memória compartilhada deixa de atender requisitos de estabilidade, isolamento e escala, use o modo híbrido multiambiente.

## Implantação

- **Supervisor**: gestão central de apps e ambientes
- **Worker**: execução real das apps
- **Redis**: cache de configuração e canal de comandos

Criação automática de ambiente ainda não está disponível; os Workers devem ser provisionados manualmente.

### Dependências

- Redis
- Banco de dados para Supervisor e Workers

### Variáveis (Supervisor)

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Variáveis (Worker)

```bash
APP_MODE=worker
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=local
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
ENVIRONMENT_NAME=
ENVIRONMENT_URL=
ENVIRONMENT_PROXY_URL=
```

### Exemplo Docker Compose

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    ports:
      - '14000:80'
```

## Uso

A operação básica de app é a mesma do [modo de memória compartilhada](./local.md).

### Environment

No Supervisor, veja ambientes registrados em **Environment**.

![](https://static-docs.nocobase.com/202512291830371.png)

### Criação de app

Escolha um ou mais ambientes ao criar app. Normalmente um ambiente é suficiente.

![](https://static-docs.nocobase.com/202512291835086.png)

### Lista e status

A lista mostra ambiente e status de execução da app.

![](https://static-docs.nocobase.com/202512291842216.png)

### Fila de inicialização

Inicialização em múltiplos ambientes entra em fila para evitar corrida de dados.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy

Acesso via `/apps/:appName/admin`. Em múltiplos ambientes, selecione o alvo do proxy.

![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
