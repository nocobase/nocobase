:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/get-started/system-requirements).
:::

# Requisitos do Sistema

Os requisitos de sistema descritos neste documento aplicam-se **apenas ao serviço da aplicação NocoBase em si** e abrangem os recursos de computação e memória necessários para os processos da aplicação. Eles **não cobrem serviços de terceiros dependentes**, incluindo, mas não se limitando a:

- Gateways de API / proxies reversos
- Serviços de banco de dados (por exemplo, MySQL ou PostgreSQL)
- Serviços de cache (por exemplo, Redis)
- Middleware, como filas de mensagens ou armazenamento de objetos

Exceto para validação de funcionalidades ou cenários puramente experimentais, **recomendamos fortemente implantar os serviços de terceiros acima separadamente** em servidores ou contêineres dedicados, ou utilizando serviços de nuvem correspondentes.

A configuração do sistema e o planejamento de capacidade desses serviços devem ser avaliados e ajustados separadamente com base no **volume real de dados, carga de trabalho e nível de concorrência**.

## Modo de Implantação em Nó Único

O modo de implantação em nó único significa que o serviço da aplicação NocoBase é executado em um único servidor ou instância de contêiner.

### Requisitos Mínimos de Hardware

| Recurso | Requisito |
|---|---|
| CPU | 1 núcleo |
| Memória | 2 GB |

**Cenários aplicáveis**:

- Microempresas
- Prova de conceito (POC)
- Ambientes de desenvolvimento / teste
- Cenários com quase nenhum acesso simultâneo

:::info{title=Dicas}

- Esta especificação apenas garante que o sistema possa ser executado; ela não garante o desempenho.
- À medida que o volume de dados ou as solicitações simultâneas aumentam, os recursos do sistema podem se tornar rapidamente um gargalo.
- Para **desenvolvimento de código-fonte, desenvolvimento de plugins ou compilação e implantação a partir do código-fonte**, reserve **pelo menos 4 GB de memória livre** para garantir que as etapas de instalação de dependências, compilação e build sejam concluídas com sucesso.

:::

### Requisitos de Hardware Recomendados

| Recurso | Especificação Recomendada |
|---|---|
| CPU | 2 núcleos |
| Memória | ≥ 4 GB |

**Cenários aplicáveis**:

Adequado para cargas de trabalho de pequeno a médio porte com concorrência limitada em ambientes de produção.

:::info{title=Dicas}

- Com esta configuração, o sistema pode lidar com operações rotineiras de administração e cargas de trabalho de negócios leves.
- Quando a complexidade do negócio, o acesso simultâneo ou as tarefas em segundo plano aumentarem, considere atualizar a especificação do hardware ou migrar para o modo cluster.

:::

## Modo Cluster

O modo cluster é projetado para cargas de trabalho de médio a grande porte com maior concorrência. Você pode realizar a escala horizontal para melhorar a disponibilidade e a taxa de transferência (consulte [Modo Cluster](/cluster-mode) para mais detalhes).

### Requisitos de Hardware por Nó

No modo cluster, a configuração de hardware recomendada para cada nó da aplicação (Pod / instância) é idêntica à do modo de implantação em nó único.

**Configuração mínima por nó:**

- CPU: 1 núcleo
- Memória: 2 GB

**Configuração recomendada por nó:**

- CPU: 2 núcleos
- Memória: 4 GB

### Planejamento do Número de Nós

- Dimensione o número de nós conforme necessário (2–N).
- O número real de nós depende de:
  - Tráfego simultâneo
  - Complexidade da lógica de negócio
  - Tarefas em segundo plano e cargas de trabalho assíncronas
  - Capacidade de resposta de dependências externas

Recomendações para ambientes de produção:

- Ajuste o número de nós dinamicamente com base em métricas de monitoramento (CPU, memória, latência de solicitação, etc.).
- Reserve uma margem de recursos para lidar com picos de tráfego.