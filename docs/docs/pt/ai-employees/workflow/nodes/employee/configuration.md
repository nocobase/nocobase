# Nó de Funcionário de IA

## Introdução

O nó de Funcionário de IA é usado em um Workflow para atribuir a um Funcionário de IA a tarefa de concluir um trabalho específico e, em seguida, gerar informações estruturadas.

Após criar um Workflow, é possível selecionar o nó de Funcionário de IA ao adicionar um nó ao Workflow.

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## Configuração do Nó
### Preparação

Antes de configurar o nó de Funcionário de IA, você precisa entender como construir um Workflow, como configurar o serviço de LLM, bem como o papel dos Funcionários de IA integrados e como criar um Funcionário de IA.

Você pode consultar os seguintes documentos:
  - [Workflow](/workflow)
  - [Configurar serviço de LLM](/ai-employees/features/llm-service)
  - [Funcionários de IA integrados](/ai-employees/features/built-in-employee)
  - [Criar novo Funcionário de IA](/ai-employees/features/new-ai-employees)

### Tarefa
#### Selecionar Funcionário de IA

Selecione um Funcionário de IA responsável por executar a tarefa deste nó. Selecione, na lista suspensa, um Funcionário de IA integrado já habilitado no sistema ou um Funcionário de IA criado por você.

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### Selecionar Modelo

Selecione o modelo de linguagem de grande porte que irá impulsionar o Funcionário de IA. Selecione, na lista suspensa, um modelo fornecido por um serviço de LLM já configurado no sistema.

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### Selecionar Operador

Selecione um usuário do sistema para fornecer ao Funcionário de IA permissões de acesso aos dados. As consultas de dados feitas pelo Funcionário de IA serão limitadas ao escopo de permissões desse usuário.

Se o trigger fornecer um operador (como `Custom action event`), as permissões desse operador terão prioridade.

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### Prompt e Descrição da Tarefa

`Background` será enviado à IA como prompt do sistema, geralmente usado para descrever as informações de contexto da tarefa e as restrições.

`Default user message` é o prompt do usuário enviado à IA, geralmente descrevendo o conteúdo da tarefa, dizendo à IA o que ela deve fazer.

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### Anexos

`Attachments` será enviado à IA juntamente com `Default user message`. Geralmente são documentos ou imagens que a tarefa precisa processar.

Os anexos suportam dois tipos:

1. `File(load via Files collection)` usa a chave primária para obter dados de uma coleção de arquivos especificada e usá-los como anexo enviado à IA.

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` obtém o arquivo a partir de uma URL especificada e o utiliza como anexo enviado à IA.

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### Skills e Tools

Geralmente, um Funcionário de IA está vinculado a vários Skills e Tools. Aqui você pode restringir o uso a apenas alguns Skills ou Tools nesta tarefa.

O padrão é `Preset`, que utiliza os Skills e Tools predefinidos do Funcionário de IA. Definir como `Customer` permite escolher apenas alguns Skills ou Tools do Funcionário de IA.

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Pesquisa Online

A opção `Web search` controla se a IA do nó atual usará a capacidade de pesquisa online. Para mais informações sobre a pesquisa online dos Funcionários de IA, consulte: [Pesquisa Online](/ai-employees/features/web-search)

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### Feedback e Notificação
#### Saída Estruturada

Os usuários podem definir a estrutura de dados final emitida pelo nó de Funcionário de IA seguindo a especificação [JSON Schema](https://json-schema.org/).

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

Outros nós do Workflow que obtiverem dados do nó de Funcionário de IA também gerarão opções de acordo com este `JSON Schema`.

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### Valor Padrão

Por padrão, é fornecida a seguinte definição de `JSON Schema`, que define um objeto contendo uma propriedade chamada result do tipo string. A propriedade também tem um título: Result.

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

De acordo com essa definição, o nó de Funcionário de IA emitirá dados em formato JSON conforme a definição.

```json
{
  result: "Some text generated from LLM "
}
```

#### Configuração de Aprovação

O nó suporta três modos de aprovação:

- `No required`: o conteúdo gerado pela IA não requer revisão humana. Após a IA terminar a saída, o Workflow continua automaticamente.
- `Human decision`: o conteúdo gerado pela IA precisa obrigatoriamente notificar um revisor para revisão humana. O Workflow só continua após a revisão humana.
- `AI decision`: a IA decide se notifica ou não um revisor para realizar a revisão humana do conteúdo gerado.

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

Se o modo de aprovação não for `No required`, é obrigatório configurar um ou mais revisores para o nó.

Quando o Funcionário de IA do nó terminar de gerar todo o conteúdo, será enviada uma notificação a todos os revisores configurados no nó. Basta que um dos revisores notificados conclua a operação de aprovação para que o Workflow continue.

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
