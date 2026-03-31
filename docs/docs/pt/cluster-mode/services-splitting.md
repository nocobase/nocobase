:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Separação de Serviços <Badge>v1.9.0+</Badge>

## Introdução

Normalmente, todos os serviços de uma aplicação NocoBase rodam na mesma instância Node.js. À medida que as funcionalidades da aplicação se tornam mais complexas com o crescimento do negócio, alguns serviços que consomem muito tempo podem afetar o desempenho geral.

Para melhorar o desempenho da aplicação, o NocoBase permite que você separe os serviços da aplicação para rodarem em diferentes nós no modo cluster. Isso evita que problemas de desempenho de um único serviço afetem toda a aplicação, impedindo que ela responda normalmente às requisições dos usuários.

Além disso, você pode escalar horizontalmente serviços específicos de forma direcionada, melhorando a utilização dos recursos do cluster.

Ao implantar o NocoBase em um cluster, diferentes serviços podem ser separados e implantados para rodar em nós distintos. O diagrama a seguir ilustra a estrutura de separação:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Quais Serviços Podem Ser Separados

### Fluxo de Trabalho Assíncrono

**CHAVE do Serviço**: `workflow:process`

Fluxos de trabalho em modo assíncrono, após serem acionados, entrarão em uma fila para execução. Esses fluxos de trabalho podem ser considerados tarefas em segundo plano, e os usuários geralmente não precisam esperar pelo retorno dos resultados. Especialmente para processos mais complexos e demorados, com um grande volume de acionamentos, é recomendável separá-los para rodarem em nós independentes.

### Outras Tarefas Assíncronas de Nível de Usuário

**CHAVE do Serviço**: `async-task:process`

Isso inclui tarefas criadas por ações do usuário, como importação e exportação assíncronas. Em casos de grandes volumes de dados ou alta concorrência, é recomendável separá-las para rodarem em nós independentes.

## Como Separar Serviços

A separação de diferentes serviços em nós distintos é feita configurando a variável de ambiente `WORKER_MODE`. Essa variável de ambiente pode ser configurada seguindo as seguintes regras:

- `WORKER_MODE=<vazio>`: Quando não configurado ou definido como vazio, o modo de trabalho é o mesmo da instância única atual, aceitando todas as requisições e processando todas as tarefas. Isso é compatível com aplicações que não foram configuradas anteriormente.
- `WORKER_MODE=!`: O modo de trabalho é processar apenas requisições, sem processar nenhuma tarefa.
- `WORKER_MODE=workflow:process,async-task:process`: Configurado com um ou mais identificadores de serviço (separados por vírgulas), o modo de trabalho é processar apenas as tarefas desses identificadores, sem processar requisições.
- `WORKER_MODE=*`: O modo de trabalho é processar todas as tarefas em segundo plano, independentemente do módulo, mas sem processar requisições.
- `WORKER_MODE=!,workflow:process`: O modo de trabalho é processar requisições e, simultaneamente, processar apenas as tarefas de um identificador específico.
- `WORKER_MODE=-`: O modo de trabalho é não processar nenhuma requisição ou tarefa (este modo é necessário dentro do processo worker).

Por exemplo, em um ambiente K8S, você pode usar a mesma configuração de variável de ambiente para nós com a mesma funcionalidade de separação, facilitando a escalabilidade horizontal de um tipo específico de serviço.

## Exemplos de Configuração

### Múltiplos Nós com Processamento Separado

Suponha que existam três nós: `node1`, `node2` e `node3`. Eles podem ser configurados da seguinte forma:

- `node1`: Processa apenas requisições da interface do usuário (UI), configure `WORKER_MODE=!`.
- `node2`: Processa apenas tarefas de fluxo de trabalho, configure `WORKER_MODE=workflow:process`.
- `node3`: Processa apenas tarefas assíncronas, configure `WORKER_MODE=async-task:process`.

### Múltiplos Nós com Processamento Misto

Suponha que existam quatro nós: `node1`, `node2`, `node3` e `node4`. Eles podem ser configurados da seguinte forma:

- `node1` e `node2`: Processam todas as requisições regulares, configure `WORKER_MODE=!` e tenha um balanceador de carga distribuindo automaticamente as requisições para esses dois nós.
- `node3` e `node4`: Processam todas as outras tarefas em segundo plano, configure `WORKER_MODE=*`.

## Referência para Desenvolvedores

Ao desenvolver plugins de negócio, você pode separar serviços que consomem muitos recursos, com base nos requisitos do cenário. Isso pode ser alcançado das seguintes maneiras:

1. Defina um novo identificador de serviço, por exemplo, `my-plugin:process`, para a configuração da variável de ambiente, e forneça a documentação correspondente.
2. Na lógica de negócio do lado do servidor do plugin, utilize a interface `app.serving()` para verificar o ambiente e determinar se o nó atual deve fornecer um serviço específico com base na variável de ambiente.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// No código do lado do servidor do plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Processa a lógica de negócio para este serviço
} else {
  // Não processa a lógica de negócio para este serviço
}
```