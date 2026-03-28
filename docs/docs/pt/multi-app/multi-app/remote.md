---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/multi-app/multi-app/remote).
:::

# Modo Multiambiente

## Introdução

O modo de múltiplas aplicações em memória compartilhada possui vantagens óbvias na implantação e operação, mas com o aumento do número de aplicações e da complexidade do negócio, uma única instância pode enfrentar gradualmente problemas como disputa de recursos e queda de estabilidade. Para esses cenários, os usuários podem adotar uma solução de implantação híbrida multiambiente para suportar requisitos de negócios mais complexos.

Neste modo, o sistema implanta uma aplicação de entrada como centro unificado de gerenciamento e agendamento, enquanto implanta várias instâncias do NocoBase como ambientes de execução de aplicações independentes, responsáveis por carregar as aplicações de negócio reais. Cada ambiente é isolado entre si e trabalha de forma colaborativa, dispersando efetivamente a pressão de uma única instância e melhorando significativamente a estabilidade, escalabilidade e capacidade de isolamento de falhas do sistema.

No nível de implantação, diferentes ambientes podem ser executados em processos independentes, implantados como diferentes contêineres Docker ou na forma de múltiplos Deployments do Kubernetes, sendo capazes de se adaptar de forma flexível a ambientes de infraestrutura de diferentes escalas e arquiteturas.

## Implantação

No modo de implantação híbrida multiambiente:

- A aplicação de entrada (Supervisor) é responsável pelo gerenciamento unificado de informações de aplicações e ambientes.
- A aplicação de trabalho (Worker) atua como o ambiente de execução real do negócio.
- As configurações de aplicação e ambiente são armazenadas em cache via Redis.
- A sincronização de comandos e status entre a aplicação de entrada e a aplicação de trabalho depende da comunicação via Redis.

Atualmente, a função de criação de ambiente ainda não é fornecida; cada aplicação de trabalho precisa ser implantada manualmente e configurada com as informações de ambiente correspondentes antes de poder ser identificada pela aplicação de entrada.

### Dependências de Arquitetura

Antes da implantação, prepare os seguintes serviços:

- Redis
  - Cache de configurações de aplicação e ambiente
  - Atua como canal de comunicação de comandos entre a aplicação de entrada e a aplicação de trabalho

- Banco de dados
  - Serviços de banco de dados aos quais a aplicação de entrada e a aplicação de trabalho precisam se conectar

### Aplicação de Entrada (Supervisor)

A aplicação de entrada atua como centro de gerenciamento unificado, responsável pela criação, inicialização, interrupção de aplicações e agendamento de ambientes, bem como pelo proxy de acesso às aplicações.

Explicação da configuração das variáveis de ambiente da aplicação de entrada:

```bash
# Modo da aplicação
APP_MODE=supervisor
# Método de descoberta de aplicações
APP_DISCOVERY_ADAPTER=remote
# Método de gerenciamento de processos de aplicações
APP_PROCESS_ADAPTER=remote
# Redis para cache de configuração de aplicações e ambientes
APP_SUPERVISOR_REDIS_URL=
# Método de comunicação de comandos de aplicações
APP_COMMAND_ADPATER=redis
# Redis para comunicação de comandos de aplicações
APP_COMMAND_REDIS_URL=
```

### Aplicação de Trabalho (Worker)

A aplicação de trabalho atua como o ambiente de execução real do negócio, responsável por carregar e executar instâncias específicas de aplicações NocoBase.

Explicação da configuração das variáveis de ambiente da aplicação de trabalho:

```bash
# Modo da aplicação
APP_MODE=worker
# Método de descoberta de aplicações
APP_DISCOVERY_ADAPTER=remote
# Método de gerenciamento de processos de aplicações
APP_PROCESS_ADAPTER=local
# Redis para cache de configuração de aplicações e ambientes
APP_SUPERVISOR_REDIS_URL=
# Método de comunicação de comandos de aplicações
APP_COMMAND_ADPATER=redis
# Redis para comunicação de comandos de aplicações
APP_COMMAND_REDIS_URL=
# Identificador do ambiente
ENVIRONMENT_NAME=
# URL de acesso ao ambiente
ENVIRONMENT_URL=
# URL de acesso via proxy do ambiente
ENVIRONMENT_PROXY_URL=
```

### Exemplo de Docker Compose

O exemplo a seguir mostra uma solução de implantação híbrida multiambiente usando contêineres Docker como unidades de execução, implantando simultaneamente uma aplicação de entrada e duas aplicações de trabalho via Docker Compose.

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
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Manual do Usuário

As operações básicas de gerenciamento de aplicações são as mesmas do modo de memória compartilhada; consulte o [Modo de Memória Compartilhada](./local.md). Esta seção apresenta principalmente o conteúdo relacionado à configuração multiambiente.

### Lista de Ambientes

Após a conclusão da implantação, acesse a página "Gerenciador de Aplicações" da aplicação de entrada. Na aba "Ambientes", você pode visualizar a lista de ambientes de trabalho registrados. Isso inclui o identificador do ambiente, a versão da aplicação de trabalho, a URL de acesso e o status, entre outras informações. A aplicação de trabalho envia um batimento cardíaco (heartbeat) a cada 2 minutos para garantir a disponibilidade do ambiente.

![](https://static-docs.nocobase.com/202512291830371.png)

### Criação de Aplicação

Ao criar uma aplicação, você pode selecionar um ou mais ambientes de execução para especificar em quais aplicações de trabalho essa aplicação será implantada. Em circunstâncias normais, recomenda-se selecionar apenas um ambiente. Selecione múltiplos ambientes apenas quando a aplicação de trabalho tiver realizado a [divisão de serviços](/cluster-mode/services-splitting) e for necessário implantar a mesma aplicação em múltiplos ambientes de execução para alcançar o compartilhamento de carga ou isolamento de capacidades.

![](https://static-docs.nocobase.com/202512291835086.png)

### Lista de Aplicações

A página da lista de aplicações exibirá o ambiente de execução atual e as informações de status de cada aplicação. Se a aplicação for implantada em múltiplos ambientes, múltiplos status de execução serão exibidos. Em condições normais, a mesma aplicação em múltiplos ambientes manterá um status unificado, exigindo controle unificado para iniciar e parar.

![](https://static-docs.nocobase.com/202512291842216.png)

### Inicialização de Aplicação

Como a inicialização da aplicação pode gravar dados de inicialização no banco de dados, para evitar condições de corrida em múltiplos ambientes, as aplicações implantadas em múltiplos ambientes entrarão em uma fila para inicialização.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy de Acesso à Aplicação

As aplicações de trabalho podem ser acessadas via proxy através do subcaminho `/apps/:appName/admin` da aplicação de entrada.

![](https://static-docs.nocobase.com/202601082154230.png)

Se a aplicação for implantada em múltiplos ambientes, é necessário especificar um ambiente de destino para o acesso via proxy.

![](https://static-docs.nocobase.com/202601082155146.png)

Por padrão, o endereço de acesso via proxy utiliza o endereço de acesso da aplicação de trabalho, correspondente à variável de ambiente `ENVIRONMENT_URL`. Certifique-se de que este endereço seja acessível no ambiente de rede onde a aplicação de entrada está localizada. Se for necessário usar um endereço de acesso via proxy diferente, ele pode ser sobrescrito através da variável de ambiente `ENVIRONMENT_PROXY_URL`.