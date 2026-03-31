:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Preparação

Antes de implantar um aplicativo em cluster, você precisa concluir as seguintes preparações.

## Licença de Plugin Comercial

Para executar um aplicativo NocoBase em modo de cluster, você precisará do suporte dos seguintes plugins:

| Função | Plugin |
|---|---|
| Adaptador de cache | Embutido |
| Adaptador de sinal de sincronização | `@nocobase/plugin-pubsub-adapter-redis` |
| Adaptador de fila de mensagens | `@nocobase/plugin-queue-adapter-redis` ou `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adaptador de bloqueio distribuído | `@nocobase/plugin-lock-adapter-redis` |
| Alocador de Worker ID | `@nocobase/plugin-workerid-allocator-redis` |

Primeiro, certifique-se de ter obtido as licenças para os plugins acima (você pode adquirir as licenças correspondentes através da plataforma de serviços de plugins comerciais).

## Componentes do Sistema

Outros componentes do sistema, além da própria instância do aplicativo, podem ser selecionados pela equipe de operações com base nas necessidades operacionais de cada time.

### Banco de Dados

Como o modo de cluster atual se concentra apenas nas instâncias do aplicativo, o banco de dados, por enquanto, suporta apenas um único nó. Se você tiver uma arquitetura de banco de dados como mestre-escravo, precisará implementá-la por conta própria através de um middleware e garantir que seja transparente para o aplicativo NocoBase.

### Middleware

O modo de cluster do NocoBase depende de alguns middlewares para comunicação e coordenação entre os clusters, incluindo:

- **Cache**: Utiliza um middleware de cache distribuído baseado em Redis para melhorar a velocidade de acesso aos dados.
- **Sinal de sincronização**: Utiliza o recurso de stream do Redis para implementar a transmissão de sinais de sincronização entre clusters.
- **Fila de mensagens**: Utiliza um middleware de fila de mensagens baseado em Redis ou RabbitMQ para processamento assíncrono de mensagens.
- **Bloqueio distribuído**: Utiliza um bloqueio distribuído baseado em Redis para garantir a segurança do acesso a recursos compartilhados no cluster.

Quando todos os componentes de middleware utilizam Redis, você pode iniciar um único serviço Redis na rede interna do cluster (ou Kubernetes). Alternativamente, você pode habilitar um serviço Redis separado para cada função (cache, sinal de sincronização, fila de mensagens e bloqueio distribuído).

**Recomendações de Versão**

- Redis: >=8.0 ou uma versão do redis-stack que inclua o recurso Bloom Filter.
- RabbitMQ: >=4.0

### Armazenamento Compartilhado

O NocoBase precisa usar o diretório `storage` para armazenar arquivos relacionados ao sistema. No modo de múltiplos nós, você deve montar um disco na nuvem (ou NFS) para suportar o acesso compartilhado entre os vários nós. Caso contrário, o armazenamento local não será sincronizado automaticamente e não funcionará corretamente.

Ao implantar com Kubernetes, consulte a seção [Implantação Kubernetes: Armazenamento Compartilhado](./kubernetes#shared-storage).

### Balanceamento de Carga

O modo de cluster exige um balanceador de carga para distribuir as requisições, realizar verificações de saúde das instâncias do aplicativo e gerenciar o failover. Esta parte deve ser selecionada e configurada de acordo com as necessidades operacionais da sua equipe.

Tomando um Nginx auto-hospedado como exemplo, adicione o seguinte conteúdo ao arquivo de configuração:

```
upstream myapp {
    # ip_hash; # Pode ser usado para persistência de sessão. Quando ativado, as requisições do mesmo cliente são sempre enviadas para o mesmo servidor backend.
    server 172.31.0.1:13000; # Nó interno 1
    server 172.31.0.2:13000; # Nó interno 2
    server 172.31.0.3:13000; # Nó interno 3
}

server {
    listen 80;

    location / {
        # Use o upstream definido para balanceamento de carga
        proxy_pass http://myapp;
        # ... outras configurações
    }
}
```

Isso significa que as requisições são encaminhadas por proxy reverso e distribuídas para diferentes nós de servidor para processamento.

Para middlewares de balanceamento de carga fornecidos por outros provedores de serviços em nuvem, consulte a documentação de configuração específica do provedor.

## Configuração de Variáveis de Ambiente

Todos os nós no cluster devem usar a mesma configuração de variáveis de ambiente. Além das [variáveis de ambiente](/api/cli/env) básicas do NocoBase, você também precisará configurar as seguintes variáveis de ambiente relacionadas ao middleware.

### Modo Multi-core

Quando o aplicativo é executado em um nó multi-core, você pode habilitar o modo multi-core do nó:

```ini
# Habilitar modo multi-core do PM2
# CLUSTER_MODE=max # Desativado por padrão, requer configuração manual
```

Se você estiver implantando pods de aplicativo no Kubernetes, pode ignorar esta configuração e controlar o número de instâncias do aplicativo através do número de réplicas do pod.

### Cache

```ini
# Adaptador de cache, precisa ser definido como redis no modo de cluster (o padrão é em memória se não for definido)
CACHE_DEFAULT_STORE=redis

# URL de conexão do adaptador de cache Redis, precisa ser preenchida
CACHE_REDIS_URL=
```

### Sinal de Sincronização

```ini
# URL de conexão do adaptador de sincronização Redis, o padrão é redis://localhost:6379/0 se não for definido
PUBSUB_ADAPTER_REDIS_URL=
```

### Bloqueio Distribuído

```ini
# Adaptador de bloqueio, precisa ser definido como redis no modo de cluster (o padrão é bloqueio local em memória se não for definido)
LOCK_ADAPTER_DEFAULT=redis

# URL de conexão do adaptador de bloqueio Redis, o padrão é redis://localhost:6379/0 se não for definido
LOCK_ADAPTER_REDIS_URL=
```

### Fila de Mensagens

```ini
# Habilita o Redis como adaptador de fila de mensagens, o padrão é o adaptador em memória se não for definido
QUEUE_ADAPTER=redis
# URL de conexão do adaptador de fila de mensagens Redis, o padrão é redis://localhost:6379/0 se não for definido
QUEUE_ADAPTER_REDIS_URL=
```

### Alocador de Worker ID

Algumas coleções de sistema no NocoBase utilizam IDs globalmente únicos como chaves primárias. Para evitar conflitos de chave primária em um cluster, cada instância de aplicativo deve obter um Worker ID exclusivo através do Alocador de Worker ID. O intervalo atual de Worker ID é de 0 a 31, o que significa que cada aplicativo pode executar até 32 nós simultaneamente. Para detalhes sobre o design do ID globalmente único, consulte [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# URL de conexão Redis para o Alocador de Worker ID.
# Se omitido, um Worker ID aleatório será atribuído.
REDIS_URL=
```

:::info{title=Dica}
Geralmente, os adaptadores relacionados podem usar a mesma instância Redis, mas é melhor usar bancos de dados diferentes para evitar possíveis problemas de conflito de chaves, por exemplo:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Atualmente, cada plugin utiliza suas próprias variáveis de ambiente relacionadas ao Redis. No futuro, consideraremos usar `REDIS_URL` como configuração de fallback.

:::

Se você usa Kubernetes para gerenciar o cluster, pode configurar as variáveis de ambiente acima em um ConfigMap ou Secret. Para mais conteúdo relacionado, consulte [Implantação Kubernetes](./kubernetes).

Após a conclusão de todas as preparações acima, você pode prosseguir para as [Operações](./operations) para continuar gerenciando as instâncias do aplicativo.