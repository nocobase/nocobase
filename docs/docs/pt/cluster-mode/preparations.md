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

Além das próprias instâncias da aplicação, uma implantação em cluster também requer componentes de sistema como banco de dados, middleware, armazenamento compartilhado e balanceamento de carga. Cada equipe pode escolher a implementação concreta desses componentes de acordo com o seu próprio modelo operacional.

### Banco de Dados

Como o modo de cluster atual se concentra apenas nas instâncias do aplicativo, o banco de dados, por enquanto, suporta apenas um único nó. Se você tiver uma arquitetura de banco de dados como mestre-escravo, precisará implementá-la por conta própria através de um middleware e garantir que seja transparente para o aplicativo NocoBase.

Se você precisar de warm standby ou recuperação de desastres entre zonas de disponibilidade ou regiões, a estratégia de sincronização e comutação do banco de dados deverá ser projetada e implementada pela sua equipe de operações.

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

O NocoBase precisa usar o diretório `storage` para armazenar arquivos relacionados ao sistema, e o armazenamento compartilhado também é um componente obrigatório de uma implantação em cluster. No modo de múltiplos nós, você pode escolher diferentes implementações de acordo com o ambiente de infraestrutura, como discos em nuvem, NFS ou EFS, para suportar o acesso compartilhado entre vários nós. Caso contrário, os arquivos do sistema não serão sincronizados automaticamente e a aplicação não funcionará corretamente.

Ao implantar com Kubernetes, consulte a seção [Implantação Kubernetes: Armazenamento Compartilhado](./kubernetes#shared-storage).

#### O que normalmente é armazenado no diretório `storage`

O conteúdo do diretório `storage` varia de acordo com os plugins habilitados e a forma de implantação. Com base na implementação atual, os conteúdos mais comuns incluem:

| Caminho | Finalidade | Recomendação de uso |
| --- | --- | --- |
| `storage/uploads` | Arquivos enviados quando o modo de armazenamento local é usado | Em clusters de produção, priorize armazenamento de objetos como S3 / OSS / COS |
| `storage/plugins` | Pacotes de plugins locais instalados, enviados ou descobertos em tempo de execução | Se você depende de plugins locais, este diretório precisa ser compartilhado; se os plugins já estiverem embutidos na imagem, essa dependência pode ser reduzida |
| `storage/apps/<app>/jwt_secret.dat` | Segredo padrão de token gerado automaticamente quando `APP_KEY` não está configurado explicitamente | Não dependa deste arquivo em produção; configure `APP_KEY` explicitamente |
| `storage/apps/<app>/aes_key.dat` | Chave AES padrão gerada automaticamente quando `APP_AES_SECRET_KEY` não está configurado explicitamente | Não dependa deste arquivo em produção; configure `APP_AES_SECRET_KEY` explicitamente |
| `storage/environment-variables/<app>/aes_key.dat` | Arquivo de chave AES usado em cenários do plugin de variáveis de ambiente | Recomenda-se montar um arquivo de chave em modo somente leitura |
| `storage/logs` | Diretório padrão de logs e alguns registros de migração | Recomenda-se integrar uma plataforma externa de logs no futuro |
| `storage/tmp` | Arquivos temporários para importação, exportação, migração etc. | Pode ser temporário, mas se precisar ser reutilizado entre nós, deve ser compartilhado, ou a operação deve ser fixada em um único nó de administração |
| `storage/backups`, `storage/duplicator`, `storage/migration-manager` | Artefatos relacionados a backup, restauração e migração | Devem ser tratados como diretórios operacionais, armazenados de forma persistente e não modificados de forma concorrente por vários nós |

A tabela acima não é exaustiva, mas mostra um ponto importante: `storage` mistura arquivos de negócio, arquivos de chaves, diretórios de plugins, logs e artefatos temporários relacionados à operação. Por isso, em implantações em cluster, a prática básica costuma ser compartilhar e persistir todo o diretório `/app/nocobase/storage`.

#### Recomendações relacionadas ao armazenamento

A consistência de cluster no NocoBase depende principalmente do banco de dados, do Redis, das filas de mensagens e dos bloqueios distribuídos, e não de usar o sistema de arquivos compartilhado como meio de coordenação de alta concorrência.

Portanto, recomenda-se:

- Para arquivos de negócio de alta frequência, como anexos, priorize armazenamento de objetos. Não é recomendável depender de armazenamento local por longo prazo em clusters de produção.
- O armazenamento compartilhado deve ser usado principalmente para hospedar o diretório `storage`, e não como um serviço de armazenamento de arquivos de alta vazão.
- Operações como instalação e atualização de plugins, backup, restauração e migração devem ser realizadas somente após reduzir o cluster para um único nó; após a conclusão, o cluster pode ser escalado novamente.

### Balanceamento de Carga

O modo de cluster exige um balanceador de carga para distribuir as requisições, realizar verificações de saúde das instâncias do aplicativo e gerenciar o failover. Esta parte deve ser selecionada e configurada de acordo com as necessidades operacionais da sua equipe.

Tomando um Nginx auto-hospedado como exemplo, adicione o seguinte conteúdo ao arquivo de configuração:

```
upstream myapp {
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

Para implantações de alta disponibilidade, recomenda-se:

- Executar pelo menos 2 instâncias da aplicação dentro do mesmo cluster e deixar que o balanceador de carga cuide do failover das instâncias.
- A verificação de saúde do balanceador de carga deve refletir a disponibilidade real da aplicação, e não apenas se a porta está aberta.
- Se você precisar de warm standby entre zonas de disponibilidade ou regiões, normalmente deverá implantar vários clusters independentes, e a equipe de operações será responsável pela sincronização e comutação do banco de dados, do armazenamento compartilhado e da infraestrutura restante.

## Configuração de Variáveis de Ambiente

Todos os nós no cluster devem usar a mesma configuração de variáveis de ambiente. Além das [variáveis de ambiente](/api/cli/env) básicas do NocoBase, você também precisará configurar as seguintes variáveis de ambiente relacionadas ao middleware.

### Segredos principais

Além das variáveis de ambiente do middleware, todos os nós do cluster também devem configurar explicitamente os mesmos segredos principais:

```ini
APP_KEY=
APP_AES_SECRET_KEY=
# Ou use um arquivo de chave montado em modo somente leitura
# APP_AES_SECRET_KEY_PATH=
```

- `APP_KEY` é usado para a assinatura de tokens / JWT. Se não for configurado explicitamente, a aplicação recorrerá ao arquivo de segredo padrão em `storage`.
- `APP_AES_SECRET_KEY` é usado para descriptografar campos sensíveis no banco de dados. Se não for configurado explicitamente, a aplicação também recorrerá ao arquivo de segredo padrão em `storage`.
- Em contêineres efêmeros ou implantações com múltiplos nós, depender de arquivos de chave locais gerados automaticamente pode fazer com que os tokens se tornem inválidos após um reinício, ou que dados históricos criptografados não possam mais ser descriptografados.

:::info{title=Dica}
`APP_AES_SECRET_KEY` deve ser uma chave AES-256 de 32 bytes, representada por 64 caracteres hexadecimais.

Em ambientes de nuvem, recomenda-se gerenciar esses valores centralmente por meio de serviços como Secrets Manager, SSM Parameter Store, Kubernetes Secret ou um arquivo de chave montado em modo somente leitura.
:::

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
