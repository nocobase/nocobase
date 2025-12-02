---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Aprovação

## Introdução

A aprovação é um tipo de processo projetado especificamente para ser iniciado e processado manualmente, a fim de decidir o status de dados relevantes. É comumente usado para automação de escritório ou gerenciamento de processos de outras tarefas de tomada de decisão manual, por exemplo, você pode criar e gerenciar **fluxos de trabalho** manuais para cenários como "solicitações de licença", "aprovações de reembolso de despesas" e "aprovações de compra de matéria-prima".

O **plugin** de Aprovação oferece um tipo de **fluxo de trabalho** (gatilho) dedicado "Aprovação (evento)" e um nó "Aprovação" dedicado a este processo. Combinado com as **coleções** personalizadas e blocos personalizados exclusivos do NocoBase, você pode criar e gerenciar de forma rápida e flexível vários cenários de aprovação.

## Criar um Fluxo de Trabalho

Ao criar um **fluxo de trabalho**, selecione o tipo "Aprovação" para criar um **fluxo de trabalho** de aprovação:

![Gatilho de Aprovação_Criar Fluxo de Trabalho de Aprovação](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Em seguida, na interface de configuração do **fluxo de trabalho**, clique no gatilho para abrir um pop-up para mais configurações.

## Configuração do Gatilho

### Vincular uma Coleção

O **plugin** de Aprovação do NocoBase foi projetado para flexibilidade e pode ser usado com qualquer **coleção** personalizada. Isso significa que a configuração de aprovação não precisa reconfigurar o modelo de dados, mas reutiliza diretamente uma **coleção** existente. Portanto, após entrar na configuração do gatilho, você precisa primeiro selecionar uma **coleção** para determinar qual **coleção** de dados acionará este **fluxo de trabalho** quando for criada ou atualizada:

![Gatilho de Aprovação_Configuração do Gatilho_Selecionar Coleção](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Em seguida, no formulário para criar (ou editar) dados da **coleção** correspondente, vincule este **fluxo de trabalho** ao botão de envio:

![Iniciar Aprovação_Vincular Fluxo de Trabalho](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Depois disso, quando um usuário enviar este formulário, o **fluxo de trabalho** de aprovação correspondente será acionado. Os dados enviados não são apenas salvos na **coleção** correspondente, mas também são registrados (snapshot) no fluxo de aprovação para que os aprovadores subsequentes possam revisar e usar.

### Retirar

Se um **fluxo de trabalho** de aprovação permitir que o iniciador o retire, você precisa habilitar o botão "Retirar" na configuração da interface do iniciador:

![Gatilho de Aprovação_Configuração do Gatilho_Permitir Retirada](https://static-docs.nocobase.com/20251029232544.png)

Uma vez habilitado, uma aprovação iniciada por este **fluxo de trabalho** pode ser retirada pelo iniciador antes que qualquer aprovador a processe. No entanto, depois que qualquer aprovador em um nó de aprovação subsequente o tiver processado, ele não poderá mais ser retirado.

:::info{title=Dica}
Após habilitar ou excluir o botão de retirada, no pop-up de configuração do gatilho, você precisa clicar em salvar e enviar para que as alterações entrem em vigor.
:::

### Configuração da Interface do Formulário do Iniciador

Por fim, você precisa configurar a interface do formulário do iniciador. Esta interface será usada para ações de envio ao iniciar a partir do bloco do centro de aprovação e ao reiniciar após uma retirada. Clique no botão de configuração para abrir o pop-up:

![Gatilho de Aprovação_Configuração do Gatilho_Formulário do Iniciador](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Você pode adicionar um formulário de preenchimento para a interface do iniciador com base na **coleção** vinculada, ou adicionar texto descritivo (Markdown) para prompts e orientação. O formulário é obrigatório; caso contrário, o iniciador não poderá realizar nenhuma ação ao entrar nesta interface.

Após adicionar um bloco de formulário, assim como em uma interface de configuração de formulário comum, você pode adicionar componentes de campo da **coleção** correspondente e organizá-los conforme necessário para organizar o conteúdo a ser preenchido no formulário:

![Gatilho de Aprovação_Configuração do Gatilho_Formulário do Iniciador_Configuração de Campo](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Além do botão de envio direto, você também pode adicionar um botão de ação "Salvar como Rascunho" para suportar um processo de armazenamento temporário:

![Gatilho de Aprovação_Configuração do Gatilho_Formulário do Iniciador_Configuração de Ação](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Nó de Aprovação

Em um **fluxo de trabalho** de aprovação, você precisa usar o nó "Aprovação" dedicado para configurar a lógica operacional para os aprovadores processarem (aprovar, rejeitar ou retornar) a aprovação iniciada. O nó "Aprovação" só pode ser usado em **fluxos de trabalho** de aprovação. Consulte [Nó de Aprovação](../nodes/approval.md) para obter detalhes.

## Configurar Iniciação de Aprovação

Após configurar e habilitar um **fluxo de trabalho** de aprovação, você pode vinculá-lo ao botão de envio do formulário da **coleção** correspondente, permitindo que os usuários iniciem uma aprovação ao enviar:

![Iniciar Aprovação_Vincular Fluxo de Trabalho](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Após vincular o **fluxo de trabalho**, quando um usuário envia o formulário atual, uma aprovação é iniciada.

:::info{title=Dica}
Atualmente, o botão para iniciar uma aprovação suporta apenas o botão "Enviar" (ou "Salvar") em um formulário de criação ou atualização. Ele não suporta o botão "Enviar para **fluxo de trabalho**" (que só pode ser vinculado a "Evento após ação").
:::

## Central de Tarefas Pendentes

A Central de Tarefas Pendentes oferece um ponto de entrada unificado para que os usuários visualizem e processem suas tarefas pendentes. As aprovações iniciadas pelo usuário atual e suas tarefas pendentes podem ser acessadas através da Central de Tarefas Pendentes na barra de ferramentas superior, e diferentes tipos de tarefas pendentes podem ser visualizados através da navegação à esquerda.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Minhas Solicitações

#### Visualizar Aprovações Solicitadas

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Iniciar uma Nova Aprovação Diretamente

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Minhas Tarefas Pendentes

#### Lista de Tarefas Pendentes

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detalhes da Tarefa Pendente

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniciador

#### Iniciar a partir da Coleção

Para iniciar a partir de um bloco de dados, você pode fazer uma chamada como esta (usando o botão de criação da **coleção** `posts` como exemplo):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Aqui, o parâmetro URL `triggerWorkflows` é a chave do **fluxo de trabalho**; várias chaves de **fluxo de trabalho** são separadas por vírgulas. Esta chave pode ser obtida passando o mouse sobre o nome do **fluxo de trabalho** na parte superior da tela do **fluxo de trabalho**:

![Fluxo de Trabalho_Chave_Método de Visualização](https://static-docs.nocobase.com/20240426135108.png)

Após uma chamada bem-sucedida, o **fluxo de trabalho** de aprovação para a **coleção** `posts` correspondente será acionado.

:::info{title="Dica"}
Como as chamadas externas também precisam ser baseadas na identidade do usuário, ao chamar via HTTP API, assim como as solicitações enviadas da interface regular, as informações de autenticação devem ser fornecidas, incluindo o cabeçalho `Authorization` ou o parâmetro `token` (o token obtido no login), e o cabeçalho `X-Role` (o nome da função atual do usuário).
:::

Se você precisar acionar um evento para dados relacionados um-para-um nesta ação (um-para-muitos ainda não é suportado), você pode usar `!` no parâmetro para especificar os dados de gatilho para o campo de associação:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Após uma chamada bem-sucedida, o evento de aprovação para a **coleção** `categories` correspondente será acionado.

:::info{title="Dica"}
Ao acionar um evento após a ação via HTTP API, você também precisa prestar atenção ao status habilitado do **fluxo de trabalho** e se a configuração da **coleção** corresponde; caso contrário, a chamada pode não ser bem-sucedida ou pode resultar em um erro.
:::

#### Iniciar a partir da Central de Aprovação

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parâmetros**

*   `collectionName`: O nome da **coleção** de destino para iniciar a aprovação. Obrigatório.
*   `workflowId`: O ID do **fluxo de trabalho** usado para iniciar a aprovação. Obrigatório.
*   `data`: Os campos do registro da **coleção** criados ao iniciar a aprovação. Obrigatório.
*   `status`: O status do registro criado ao iniciar a aprovação. Obrigatório. Os valores possíveis incluem:
    *   `0`: Rascunho, indica salvar sem enviar para aprovação.
    *   `1`: Enviar para aprovação, indica que o iniciador envia a solicitação de aprovação, entrando no processo de aprovação.

#### Salvar e Enviar

Quando uma aprovação iniciada (ou retirada) está em estado de rascunho, você pode salvá-la ou enviá-la novamente através da seguinte API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Obter Lista de Aprovações Solicitadas

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirar

O iniciador pode retirar um registro atualmente em aprovação através da seguinte API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parâmetros**

*   `<approval id>`: O ID do registro de aprovação a ser retirado. Obrigatório.

### Aprovador

Depois que o **fluxo de trabalho** de aprovação entra em um nó de aprovação, uma tarefa pendente é criada para o aprovador atual. O aprovador pode concluir a tarefa de aprovação através da interface ou chamando a HTTP API.

#### Obter Registros de Aprovação

As tarefas pendentes são registros de aprovação. Você pode obter todos os registros de aprovação do usuário atual através da seguinte API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Aqui, `approvalRecords` é um recurso de **coleção**, então você pode usar condições de consulta comuns como `filter`, `sort`, `pageSize` e `page`.

#### Obter um Único Registro de Aprovação

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Aprovar e Rejeitar

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parâmetros**

*   `<record id>`: O ID do registro a ser aprovado. Obrigatório.
*   `status`: O status do processo de aprovação. `2` para "Aprovar", `-1` para "Rejeitar". Obrigatório.
*   `comment`: Observações para o processo de aprovação. Opcional.
*   `data`: Modificações no registro da **coleção** no nó de aprovação atual após a aprovação. Opcional (somente eficaz após aprovação).

#### Retornar <Badge>v1.9.0+</Badge>

Antes da versão v1.9.0, o retorno usava a mesma API que "Aprovar" e "Rejeitar", com `"status": 1` representando um retorno.

A partir da versão v1.9.0, o retorno tem uma API separada:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parâmetros**

*   `<record id>`: O ID do registro a ser aprovado. Obrigatório.
*   `returnToNodeKey`: A chave do nó de destino para retornar. Opcional. Quando um intervalo de nós retornáveis é configurado no nó, este parâmetro pode ser usado para especificar para qual nó retornar. Se não for configurado, este parâmetro não precisa ser passado, e o padrão será retornar ao ponto de partida para o iniciador reenviar.

#### Delegar

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parâmetros**

*   `<record id>`: O ID do registro a ser aprovado. Obrigatório.
*   `assignee`: O ID do usuário para delegar. Obrigatório.

#### Adicionar Assinante

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parâmetros**

*   `<record id>`: O ID do registro a ser aprovado. Obrigatório.
*   `assignees`: Uma lista de IDs de usuário para adicionar como assinantes. Obrigatório.
*   `order`: A ordem do assinante adicionado. `-1` significa antes de "mim", `1` significa depois de "mim".