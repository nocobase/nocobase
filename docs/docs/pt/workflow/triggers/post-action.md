---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Evento Pós-Ação

## Introdução

Todas as alterações de dados feitas pelos usuários no sistema são tipicamente realizadas por meio de uma ação, geralmente na forma de clicar em um botão. Este botão pode ser um botão de envio em um formulário ou um botão de ação em um bloco de dados. O evento pós-ação é usado para vincular fluxos de trabalho relacionados às ações desses botões, para que um processo específico seja acionado após a conclusão bem-sucedida da ação do usuário.

Por exemplo, ao adicionar ou atualizar dados, você pode configurar a opção "Vincular fluxo de trabalho" para um botão. Após a conclusão da ação, o fluxo de trabalho vinculado será acionado.

No nível de implementação, como o tratamento de eventos pós-ação ocorre na camada de middleware (middleware do Koa), chamadas de API HTTP para o NocoBase também podem acionar eventos pós-ação definidos.

## Instalação

Este é um plugin integrado, não requer instalação.

## Configuração do Gatilho

### Criar Fluxo de Trabalho

Ao criar um fluxo de trabalho, selecione "Evento Pós-Ação" como o tipo:

![Criar Fluxo de Trabalho_Gatilho de Evento Pós-Ação](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Modo de Execução

Para eventos pós-ação, você também pode escolher o modo de execução como "Síncrono" ou "Assíncrono" ao criá-lo:

![Criar Fluxo de Trabalho_Selecionar Síncrono ou Assíncrono](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Se o processo precisar ser executado e retornar imediatamente após a ação do usuário, você pode usar o modo síncrono; caso contrário, o padrão é o modo assíncrono. No modo assíncrono, a ação é concluída imediatamente após o fluxo de trabalho ser acionado, e o fluxo de trabalho será executado sequencialmente na fila em segundo plano do aplicativo.

### Configurar Coleção

Acesse a tela do fluxo de trabalho, clique no gatilho para abrir o pop-up de configuração e primeiro selecione a coleção a ser vinculada:

![Configuração do Fluxo de Trabalho_Selecionar Coleção](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Selecionar Modo de Gatilho

Em seguida, selecione o modo de gatilho, que pode ser local ou global:

![Configuração do Fluxo de Trabalho_Selecionar Modo de Gatilho](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Onde:

*   O modo local é acionado apenas em botões de ação que têm este fluxo de trabalho vinculado. Clicar em botões sem este fluxo de trabalho vinculado não o acionará. Você pode decidir vincular este fluxo de trabalho considerando se formulários com propósitos diferentes devem acionar o mesmo processo.
*   O modo global é acionado em todos os botões de ação configurados da coleção, independentemente do formulário de origem, e não há necessidade de vincular o fluxo de trabalho correspondente.

No modo local, os botões de ação que atualmente suportam vinculação são os seguintes:

*   Botões "Enviar" e "Salvar" no formulário de adição.
*   Botões "Enviar" e "Salvar" no formulário de atualização.
*   Botão "Atualizar dados" em linhas de dados (tabela, lista, kanban, etc.).

### Selecionar Tipo de Ação

Se você escolher o modo global, você também precisará selecionar o tipo de ação. Atualmente, "Criar dados" e "Atualizar dados" são suportados. Ambas as ações acionam o fluxo de trabalho após a conclusão bem-sucedida da operação.

### Selecionar Dados de Relacionamento Pré-carregados

Se você precisar usar os dados associados dos dados acionados em processos subsequentes, você pode selecionar os campos de relacionamento a serem pré-carregados:

![Configuração do Fluxo de Trabalho_Pré-carregar Relacionamento](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Após o acionamento, você pode usar diretamente esses dados relacionados no processo.

## Configuração da Ação

Para ações no modo de gatilho local, após a configuração do fluxo de trabalho, você precisa retornar à interface do usuário e vincular o fluxo de trabalho ao botão de ação do formulário do bloco de dados correspondente.

Os fluxos de trabalho configurados para o botão "Enviar" (incluindo o botão "Salvar dados") serão acionados depois que o usuário enviar o formulário correspondente e a ação de dados for concluída.

![Evento Pós-Ação_Botão Enviar](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Selecione "Vincular fluxo de trabalho" no menu de configuração do botão para abrir o pop-up de configuração de vinculação. No pop-up, você pode configurar quantos fluxos de trabalho desejar para serem acionados. Se nenhum for configurado, significa que não há necessidade de acionamento. Para cada fluxo de trabalho, você precisa primeiro especificar se os dados do gatilho são os dados do formulário inteiro ou os dados de um determinado campo de relacionamento no formulário. Em seguida, com base na coleção correspondente ao modelo de dados selecionado, selecione o fluxo de trabalho do formulário que foi configurado para corresponder a esse modelo de coleção.

![Evento Pós-Ação_Configuração de Vinculação de Fluxo de Trabalho_Seleção de Contexto](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Evento Pós-Ação_Configuração de Vinculação de Fluxo de Trabalho_Seleção de Fluxo de Trabalho](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Observação"}
O fluxo de trabalho precisa estar habilitado para poder ser selecionado na interface acima.
:::

## Exemplo

Aqui faremos uma demonstração usando a ação de criação.

Suponha um cenário de "Solicitação de Reembolso". Precisamos realizar uma revisão automática do valor e uma revisão manual para valores que excedam o limite, após um funcionário enviar uma solicitação de reembolso. Apenas as solicitações aprovadas na revisão são aceitas e, em seguida, encaminhadas ao departamento financeiro para processamento.

Primeiro, podemos criar uma coleção "Reembolso" com os seguintes campos:

- Nome do Projeto: Texto de Linha Única
- Solicitante: Muitos para Um (Usuário)
- Valor: Número
- Status: Seleção Única ("Aprovado", "Processado")

Em seguida, crie um fluxo de trabalho do tipo "Evento Pós-Ação" e configure o modelo da coleção no gatilho para ser a coleção "Reembolso":

![Exemplo_Configuração do Gatilho_Selecionar Coleção](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Defina o fluxo de trabalho para o estado habilitado, e voltaremos para configurar os nós de processamento específicos do processo mais tarde.

Em seguida, criamos um bloco de tabela para a coleção "Reembolso" na interface, adicionamos um botão "Adicionar" à barra de ferramentas e configuramos os campos do formulário correspondentes. Nas opções de configuração do botão de ação "Enviar" do formulário, abrimos a caixa de diálogo de configuração "Vincular fluxo de trabalho", selecionamos todos os dados do formulário como contexto e selecionamos o fluxo de trabalho que criamos anteriormente:

![Exemplo_Configuração do Botão do Formulário_Vincular Fluxo de Trabalho](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Após a conclusão da configuração do formulário, retornamos à orquestração lógica do fluxo de trabalho. Por exemplo, exigimos uma revisão manual por um administrador quando o valor é superior a 500, caso contrário, é aprovado diretamente. Após a aprovação, um registro de reembolso é criado e processado posteriormente pelo departamento financeiro (omitido).

![Exemplo_Fluxo de Processamento](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Ignorando o processamento financeiro subsequente, a configuração do processo de solicitação de reembolso está agora completa. Quando um funcionário preenche e envia uma solicitação de reembolso, o fluxo de trabalho correspondente será acionado. Se o valor da despesa for inferior a 500, um registro será criado automaticamente e aguardará processamento adicional pelo financeiro. Caso contrário, será revisado por um supervisor e, após a aprovação, um registro também será criado e entregue ao financeiro.

O processo neste exemplo também pode ser configurado em um botão "Enviar" comum. Você pode decidir se cria um registro primeiro antes de executar processos subsequentes com base no cenário de negócios específico.

## Chamada Externa

O acionamento de eventos pós-ação não se limita às operações da interface do usuário; também pode ser acionado por meio de chamadas de API HTTP.

:::info{title="Observação"}
Ao acionar um evento pós-ação via chamada de API HTTP, você também precisa prestar atenção ao estado habilitado do fluxo de trabalho e se a configuração da coleção corresponde, caso contrário, a chamada pode não ser bem-sucedida ou pode ocorrer um erro.
:::

Para fluxos de trabalho vinculados localmente a um botão de ação, você pode chamá-lo assim (usando o botão de criação da coleção `posts` como exemplo):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Onde o parâmetro URL `triggerWorkflows` é a chave do fluxo de trabalho, com múltiplos fluxos de trabalho separados por vírgulas. Essa chave pode ser obtida passando o mouse sobre o nome do fluxo de trabalho na parte superior da tela do fluxo de trabalho:

![Fluxo de Trabalho_Chave_Método de Visualização](https://static-docs.nocobase.com/20240426135108.png)

Após o sucesso da chamada acima, o evento pós-ação da coleção `posts` correspondente será acionado.

:::info{title="Observação"}
Como as chamadas externas também precisam ser baseadas na identidade do usuário, ao chamar via API HTTP, assim como as solicitações enviadas da interface normal, informações de autenticação devem ser fornecidas, incluindo o cabeçalho de solicitação `Authorization` ou o parâmetro `token` (o token obtido no login), e o cabeçalho de solicitação `X-Role` (o nome da função atual do usuário).
:::

Se você precisar acionar um evento para dados de relacionamento um-para-um nesta ação (um-para-muitos ainda não é suportado), você pode usar `!` no parâmetro para especificar os dados de gatilho do campo de relacionamento:

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

Após o sucesso da chamada acima, o evento pós-ação da coleção `categories` correspondente será acionado.

:::info{title="Observação"}
Se o evento estiver configurado no modo global, você não precisa usar o parâmetro URL `triggerWorkflows` para especificar o fluxo de trabalho correspondente. Basta chamar a ação da coleção correspondente para acioná-lo.
:::

## Perguntas Frequentes

### Diferença em relação ao Evento Pré-Ação

*   Evento Pré-Ação: Acionado antes da execução de uma ação (como adicionar, atualizar, etc.). Antes da execução da ação, os dados solicitados podem ser validados ou processados no fluxo de trabalho. Se o fluxo de trabalho for encerrado (a solicitação for interceptada), a ação (adicionar, atualizar, etc.) não será executada.
*   Evento Pós-Ação: Acionado após o sucesso de uma ação do usuário. Neste ponto, os dados foram submetidos com sucesso e salvos no banco de dados, e os processos relacionados podem continuar a ser processados com base no resultado bem-sucedido.

Conforme mostrado na figura abaixo:

![Ordem de Execução da Ação](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Diferença em relação ao Evento de Coleção

Eventos pós-ação e eventos de coleção são semelhantes, pois ambos são processos acionados após alterações de dados. No entanto, seus níveis de implementação são diferentes. Eventos pós-ação são no nível da API, enquanto eventos de coleção são para alterações de dados na coleção.

Eventos de coleção estão mais próximos da camada subjacente do sistema. Em alguns casos, uma alteração de dados causada por um evento pode acionar outro evento, criando uma reação em cadeia. Especialmente quando dados em algumas coleções associadas também mudam durante a operação da coleção atual, eventos relacionados à coleção associada também podem ser acionados.

O acionamento de eventos de coleção não inclui informações relacionadas ao usuário. Em contraste, os eventos pós-ação estão mais próximos do lado do usuário e são o resultado das ações do usuário. O contexto do fluxo de trabalho também conterá informações relacionadas ao usuário, tornando-o adequado para lidar com processos relacionados às ações do usuário. No design futuro do NocoBase, mais eventos pós-ação que podem ser usados para acionamento podem ser expandidos, portanto, **é mais recomendado usar eventos pós-ação** para lidar com processos onde as alterações de dados são causadas pelas ações do usuário.

Outra diferença é que os eventos pós-ação podem ser vinculados localmente a botões de formulário específicos. Se houver vários formulários, algumas submissões de formulário podem acionar o evento, enquanto outras não. Eventos de coleção, por outro lado, são para alterações de dados em toda a coleção e não podem ser vinculados localmente.