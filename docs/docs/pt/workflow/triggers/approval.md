---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/workflow/triggers/approval).
:::

# Aprovação

## Introdução

A aprovação é uma forma de processo dedicada a ser iniciada e processada por humanos para decidir o status de dados relacionados. Geralmente é usada para automação de escritório ou gerenciamento de processos de outros assuntos de tomada de decisão humana. Por exemplo, você pode criar e gerenciar fluxos de trabalho manuais para cenários como "solicitações de licença", "aprovações de reembolso de despesas" e "aprovações de compra de matéria-prima".

O plugin de Aprovação fornece um tipo de fluxo de trabalho (gatilho) dedicado "Aprovação (evento)" e um nó "Aprovação" exclusivo para este processo. Combinado com as coleções e blocos personalizados exclusivos do NocoBase, você pode criar e gerenciar de forma rápida e flexível vários cenários de aprovação.

## Criar um fluxo de trabalho

Ao criar um fluxo de trabalho, selecione o tipo "Aprovação" para criar um fluxo de trabalho de aprovação:

![Gatilho de Aprovação_Criar Fluxo de Trabalho de Aprovação](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Em seguida, na interface de configuração do fluxo de trabalho, clique no gatilho para abrir o pop-up e realizar mais configurações.

## Configuração do gatilho

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Vincular uma coleção

O plugin de Aprovação do NocoBase é baseado em um design flexível e pode ser usado com qualquer coleção personalizada. Isso significa que a configuração de aprovação não precisa reconfigurar o modelo de dados, mas reutiliza diretamente uma coleção já criada. Portanto, após entrar na configuração do gatilho, primeiro você precisa selecionar uma coleção para decidir sobre quais dados da coleção o processo de aprovação será realizado:

![Gatilho de Aprovação_Configuração do Gatilho_Selecionar Coleção](https://static-docs.nocobase.com/20251226103223.png)

### Forma de acionamento

Ao iniciar uma aprovação para dados de negócios, você pode escolher entre as duas formas de acionamento a seguir:

*   **Antes de salvar os dados**

    Inicia a aprovação antes que os dados enviados sejam salvos. É adequado para cenários onde os dados só devem ser salvos após a aprovação. Neste modo, os dados no momento do início da aprovação são apenas dados temporários e só serão salvos formalmente na coleção correspondente após a aprovação ser concedida.

*   **Após salvar os dados**

    Inicia a aprovação após os dados enviados serem salvos. É adequado para cenários onde os dados podem ser salvos primeiro e depois aprovados. Neste modo, os dados já estão salvos na coleção correspondente quando a aprovação é iniciada, e as modificações feitas durante o processo de aprovação também serão salvas.

### Local de início da aprovação

Você pode escolher onde no sistema a aprovação pode ser iniciada:

*   **Apenas em blocos de dados**

    Você pode vincular a ação de qualquer bloco de formulário desta coleção ao fluxo de trabalho para iniciar a aprovação, e processar e rastrear o processo de aprovação no bloco de aprovação de um único registro. Geralmente adequado para dados de negócios.

*   **Tanto em blocos de dados quanto na Central de Tarefas**

    Além dos blocos de dados, as aprovações também podem ser iniciadas e processadas na Central de Tarefas global. Isso geralmente é adequado para dados administrativos.

### Quem pode iniciar a aprovação

Você pode configurar permissões baseadas no escopo do usuário para decidir quais usuários podem iniciar a aprovação:

*   **Todos os usuários**

    Todos os usuários do sistema podem iniciar a aprovação.

*   **Apenas usuários selecionados**

    Permite apenas que usuários dentro do escopo especificado iniciem a aprovação. Múltiplas seleções são permitidas.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Configuração da interface do formulário do iniciador

Por fim, você precisa configurar a interface do formulário do iniciador. Esta interface será usada para operações de envio ao iniciar a partir do bloco da central de aprovação e ao reiniciar após uma retirada pelo usuário. Clique no botão de configuração para abrir o pop-up:

![Gatilho de Aprovação_Configuração do Gatilho_Formulário do Iniciador](https://static-docs.nocobase.com/20251226130239.png)

Você pode adicionar um formulário de preenchimento baseado na coleção vinculada para a interface do iniciador, ou adicionar textos explicativos (Markdown) para avisos e orientações. O formulário é obrigatório; caso contrário, o iniciador não poderá realizar nenhuma operação ao entrar nesta interface.

Após adicionar o bloco de formulário, assim como em uma interface de configuração de formulário comum, você pode adicionar componentes de campo da coleção correspondente e organizá-los livremente para estruturar o conteúdo que precisa ser preenchido:

![Gatilho de Aprovação_Configuração do Gatilho_Formulário do Iniciador_Configuração de Campo](https://static-docs.nocobase.com/20251226130339.png)

Diferente do botão de envio direto, você também pode adicionar um botão de ação "Salvar rascunho" para suportar fluxos de armazenamento temporário:

![Gatilho de Aprovação_Configuração do Gatilho_Formulário do Iniciador_Configuração de Ação_Salvar](https://static-docs.nocobase.com/20251226130512.png)

Se um fluxo de trabalho de aprovação permitir que o iniciador retire a solicitação, você precisa habilitar o botão "Retirar" na configuração da interface do iniciador:

![Gatilho de Aprovação_Configuração do Gatilho_Permitir Retirada](https://static-docs.nocobase.com/20251226130637.png)

Uma vez habilitado, a aprovação iniciada por este fluxo pode ser retirada pelo iniciador antes que qualquer aprovador a processe. No entanto, após o processamento por qualquer aprovador configurado em nós de aprovação subsequentes, ela não poderá mais ser retirada.

:::info{title=Dica}
Após habilitar ou excluir o botão de retirada, você precisa clicar em salvar e enviar no pop-up de configuração do gatilho para que as alterações entrem em vigor.
:::

### Card "Minhas solicitações" <Badge>2.0+</Badge>

Pode ser usado para configurar os cards de tarefa na lista "Minhas solicitações" da Central de Tarefas.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

No card, você pode configurar livremente os campos de negócios que deseja exibir (exceto campos de relacionamento) ou informações relacionadas à aprovação.

Após a criação da solicitação de aprovação, você poderá ver o card de tarefa personalizado na lista da Central de Tarefas:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Modo de exibição de registros no fluxo

*   **Snapshot**

    O estado do registro que o solicitante e os aprovadores veem ao entrar no processo. Após o envio, eles só verão os registros que eles mesmos modificaram — não verão as atualizações feitas por outros posteriormente.

*   **Mais recente**

    O solicitante e os aprovadores sempre verão a versão mais recente do registro durante todo o processo, independentemente do estado do registro antes de sua operação. Após o término do processo, eles verão a versão final do registro.

## Nó de aprovação

Em um fluxo de trabalho de aprovação, você precisa usar o nó "Aprovação" dedicado para configurar a lógica de operação (aprovar, rejeitar ou retornar) para os aprovadores processarem a aprovação iniciada. O nó "Aprovação" só pode ser usado em fluxos de trabalho de aprovação. Consulte [Nó de Aprovação](../nodes/approval.md) para mais detalhes.

:::info{title=Dica}
Se um fluxo de trabalho de aprovação não contiver nenhum nó de "Aprovação", o fluxo será aprovado automaticamente.
:::

## Configuração de início de aprovação

Após configurar e habilitar um fluxo de trabalho de aprovação, você pode vinculá-lo ao botão de envio do formulário da coleção correspondente, para que os usuários iniciem a aprovação ao enviar:

![Iniciar Aprovação_Vincular Fluxo de Trabalho](https://static-docs.nocobase.com/20251226110710.png)

Depois disso, o envio do formulário pelo usuário acionará o fluxo de trabalho de aprovação correspondente. Os dados enviados, além de serem salvos na coleção correspondente, também serão registrados como snapshot no fluxo de aprovação para consulta pelos aprovadores subsequentes.

:::info{title=Dica}
O botão para iniciar a aprovação atualmente suporta apenas os botões "Enviar" (ou "Salvar") em formulários de criação ou atualização. Não suporta o botão "Acionar fluxo de trabalho" (este botão só pode ser vinculado a "Eventos de ação personalizada").
:::

## Central de Tarefas

A Central de Tarefas fornece uma entrada unificada para facilitar aos usuários a visualização e o processamento de tarefas. As aprovações iniciadas pelo usuário atual e as tarefas pendentes podem ser acessadas através da Central de Tarefas na barra de ferramentas superior, e diferentes tipos de tarefas podem ser visualizados através da navegação lateral esquerda.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Iniciados por mim

#### Visualizar aprovações já iniciadas

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Iniciar uma nova aprovação diretamente

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Minhas tarefas

#### Lista de tarefas

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detalhes da tarefa

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniciador

#### Iniciar a partir da coleção

Ao iniciar a partir de um bloco de dados, você pode chamar desta forma (usando o botão de criação da coleção `posts` como exemplo):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

O parâmetro de URL `triggerWorkflows` é a chave do fluxo de trabalho; múltiplos fluxos são separados por vírgulas. Esta chave pode ser obtida passando o mouse sobre o nome do fluxo de trabalho no topo da tela de configuração:

![Fluxo de Trabalho_Chave_Método de Visualização](https://static-docs.nocobase.com/20240426135108.png)

Após a chamada bem-sucedida, o fluxo de trabalho de aprovação da coleção `posts` correspondente será acionado.

:::info{title="Dica"}
Como as chamadas externas também precisam ser baseadas na identidade do usuário, ao chamar via HTTP API, as informações de autenticação devem ser fornecidas, assim como nas solicitações enviadas pela interface, incluindo o cabeçalho `Authorization` ou o parâmetro `token`, e o cabeçalho `X-Role` (nome do papel atual do usuário).
:::

Se você precisar acionar eventos para dados de relacionamento um-para-um (um-para-muitos ainda não é suportado) nesta operação, você pode usar `!` nos parâmetros para especificar os dados de gatilho do campo de relacionamento:

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

Após a chamada bem-sucedida, o evento de aprovação da coleção `categories` correspondente será acionado.

:::info{title="Dica"}
Ao acionar eventos pós-operação via HTTP API, você também deve prestar atenção ao status de ativação do fluxo de trabalho e se a configuração da coleção corresponde; caso contrário, a chamada pode não ser bem-sucedida ou ocorrer um erro.
:::

#### Iniciar a partir da central de aprovação

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

* `collectionName`: Nome da coleção de destino para iniciar a aprovação, obrigatório.
* `workflowId`: ID do fluxo de trabalho usado para iniciar a aprovação, obrigatório.
* `data`: Campos do registro da coleção criados ao iniciar a aprovação, obrigatório.
* `status`: Status do registro criado ao iniciar a aprovação, obrigatório. Os valores possíveis incluem:
  * `0`: Rascunho, indica salvar mas não enviar para aprovação.
  * `2`: Enviar aprovação, indica que o iniciador envia a solicitação e entra na aprovação.

#### Salvar e enviar

Quando uma aprovação iniciada (ou retirada) está em estado de rascunho, você pode salvar ou enviar novamente através da seguinte interface:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Obter lista de aprovações iniciadas

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirar

O iniciador pode retirar um registro que está atualmente em aprovação através da seguinte interface:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parâmetros**

* `<approval id>`: ID do registro de aprovação a ser retirado, obrigatório.

### Aprovador

Após o fluxo de aprovação entrar em um nó de aprovação, uma tarefa será criada para o aprovador atual. O aprovador pode concluir a tarefa de aprovação através da interface ou via chamada de HTTP API.

#### Obter registros de processamento de aprovação

As tarefas pendentes são registros de processamento de aprovação. Você pode obter todos os registros de processamento do usuário atual através da seguinte interface:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Como `approvalRecords` é um recurso de coleção, você também pode usar condições de consulta comuns, como `filter`, `sort`, `pageSize` e `page`.

#### Obter um único registro de processamento de aprovação

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Aprovar e rejeitar

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

* `<record id>`: ID do registro a ser processado, obrigatório.
* `status`: Status do processamento da aprovação, `2` significa "Aprovar", `-1` significa "Rejeitar", obrigatório.
* `comment`: Comentário do processamento da aprovação, opcional.
* `data`: Representa as modificações feitas no registro da coleção onde o nó de aprovação atual está localizado após a aprovação, opcional (válido apenas ao aprovar).

#### Retornar <Badge>v1.9.0+</Badge>

Antes da versão v1.9.0, o retorno usava a mesma interface que "Aprovar" e "Rejeitar", usando `"status": 1` para representar o retorno.

A partir da versão v1.9.0, o retorno tem uma interface separada:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parâmetros**

* `<record id>`: ID do registro a ser processado, obrigatório.
* `returnToNodeKey`: Chave do nó de destino para o retorno, opcional. Quando o nó está configurado com um escopo de nós para os quais se pode retornar, este parâmetro pode ser usado para especificar para qual nó retornar. Se não configurado, este parâmetro não precisa de valor, e o padrão será retornar ao ponto inicial para que o iniciador envie novamente.

#### Transferir (Delegar)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parâmetros**

* `<record id>`: ID do registro a ser processado, obrigatório.
* `assignee`: ID do usuário para quem a tarefa será transferida, obrigatório.

#### Adicionar assinatura (加签)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parâmetros**

* `<record id>`: ID do registro a ser processado, obrigatório.
* `assignees`: Lista de IDs de usuários a serem adicionados, obrigatório.
* `order`: Ordem da assinatura adicional, `-1` indica antes de "mim", `1` indica depois de "mim".