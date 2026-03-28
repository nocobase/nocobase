---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/workflow/triggers/custom-action).
:::

# Evento de Ação Personalizada

## Introdução

O NocoBase possui ações de dados comuns integradas (adicionar, excluir, editar, visualizar, etc.). Quando essas ações não conseguem atender a necessidades de negócios complexas, você pode usar o evento de ação personalizada em um fluxo de trabalho e vincular esse evento ao botão "Acionar fluxo de trabalho" de um bloco de página. Quando o usuário clicar no botão, um fluxo de trabalho de ação personalizada será acionado.

## Criar um fluxo de trabalho

Ao criar um fluxo de trabalho, selecione "Evento de Ação Personalizada":

![Criar fluxo de trabalho de "Evento de Ação Personalizada"](https://static-docs.nocobase.com/20240509091820.png)

## Configuração do acionador

### Tipo de contexto

> v1.6.0+

O tipo de contexto determina em quais botões de bloco o fluxo de trabalho pode ser vinculado:

* Sem contexto: Um evento global que pode ser vinculado a botões de ação em painéis de ações e blocos de dados;
* Registro único: Pode ser vinculado a botões de ação em blocos de dados, como linhas de tabela, formulários e detalhes;
* Múltiplos registros: Pode ser vinculado a botões de operação em massa em uma tabela.

![Configuração do acionador_Tipo de contexto](https://static-docs.nocobase.com/20250215135808.png)

### Coleção

Quando o tipo de contexto é Registro único ou Múltiplos registros, você precisa selecionar a coleção à qual o modelo de dados será vinculado:

![Configuração do acionador_Selecionar coleção](https://static-docs.nocobase.com/20250215135919.png)

### Dados de associação a serem usados

Se você precisar usar os dados de associação da linha de dados acionadora no fluxo de trabalho, poderá selecionar campos de associação profundos aqui:

![Configuração do acionador_Selecionar dados de associação a serem usados](https://static-docs.nocobase.com/20250215135955.png)

Esses campos serão automaticamente pré-carregados no contexto do fluxo de trabalho após o evento ser acionado, para que possam ser usados no fluxo de trabalho.

## Configuração da ação

A configuração dos botões de ação em diferentes blocos varia de acordo com o tipo de contexto configurado no fluxo de trabalho.

### Sem contexto

> v1.6.0+

No painel de ações e em outros blocos de dados, você pode adicionar o botão "Acionar fluxo de trabalho":

![Adicionar botão de ação ao bloco_Painel de ações](https://static-docs.nocobase.com/20250215221738.png)

![Adicionar botão de ação ao bloco_Calendário](https://static-docs.nocobase.com/20250215221942.png)

![Adicionar botão de ação ao bloco_Gráfico de Gantt](https://static-docs.nocobase.com/20250215221810.png)

Após adicionar o botão, vincule o fluxo de trabalho sem contexto criado anteriormente. Tomando como exemplo o botão no painel de ações:

![Vincular fluxo de trabalho ao botão_Painel de ações](https://static-docs.nocobase.com/20250215222120.png)

![Selecionar fluxo de trabalho para vincular_Sem contexto](https://static-docs.nocobase.com/20250215222234.png)

### Registro único

Em qualquer bloco de dados, um botão "Acionar fluxo de trabalho" pode ser adicionado à barra de ações para um único registro, como em formulários, linhas de tabela, detalhes, etc.:

![Adicionar botão de ação ao bloco_Formulário](https://static-docs.nocobase.com/20240509165428.png)

![Adicionar botão de ação ao bloco_Linha da tabela](https://static-docs.nocobase.com/20240509165340.png)

![Adicionar botão de ação ao bloco_Detalhes](https://static-docs.nocobase.com/20240509165545.png)

Após adicionar o botão, vincule o fluxo de trabalho criado anteriormente:

![Vincular fluxo de trabalho ao botão](https://static-docs.nocobase.com/20240509165631.png)

![Selecionar fluxo de trabalho para vincular](https://static-docs.nocobase.com/20240509165658.png)

Depois disso, clique neste botão para acionar o evento de ação personalizada:

![Resultado do acionamento ao clicar no botão](https://static-docs.nocobase.com/20240509170453.png)

### Múltiplos registros

> v1.6.0+

Na barra de ações de um bloco de tabela, ao adicionar um botão "Acionar fluxo de trabalho", haverá uma opção adicional para selecionar o tipo de contexto: "Sem contexto" ou "Múltiplos registros":

![Adicionar botão de ação ao bloco_Tabela](https://static-docs.nocobase.com/20250215222507.png)

Quando "Sem contexto" é selecionado, trata-se de um evento global e só pode ser vinculado a fluxos de trabalho do tipo sem contexto.

Quando "Múltiplos registros" é selecionado, você pode vincular um fluxo de trabalho do tipo múltiplos registros, que pode ser usado para operações em massa após a seleção de dados (atualmente suportado apenas por tabelas). O intervalo de fluxos de trabalho selecionáveis é limitado àqueles configurados para corresponder à coleção do bloco de dados atual:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Ao clicar no botão para acionar, você deve ter selecionado algumas linhas de dados na tabela; caso contrário, o fluxo de trabalho não será acionado:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Exemplo

Por exemplo, temos uma coleção de "Amostras". Para amostras com o status "Coletado", precisamos fornecer uma ação de "Enviar para inspeção". O envio verificará primeiro as informações básicas da amostra, gerará um dado de "Registro de inspeção" e, em seguida, alterará o status da amostra para "Enviado". Essa série de processos não pode ser concluída com cliques simples em botões de CRUD; nesse caso, você pode usar eventos de ação personalizada.

Primeiro, crie uma coleção de "Amostras" e uma coleção de "Registros de inspeção", e insira dados de teste básicos na tabela de amostras:

![Exemplo_Coleção de amostras](https://static-docs.nocobase.com/20240509172234.png)

Em seguida, crie um fluxo de trabalho de "Evento de Ação Personalizada". Se você precisar de um feedback imediato do processo de operação, poderá escolher o modo síncrono (no modo síncrono, você não pode usar nós de tipo assíncrono, como processamento manual):

![Exemplo_Criar fluxo de trabalho](https://static-docs.nocobase.com/20240509173106.png)

Na configuração do acionador, selecione "Amostras" para a coleção:

![Exemplo_Configuração do acionador](https://static-docs.nocobase.com/20240509173148.png)

Organize a lógica no fluxo de acordo com as necessidades do negócio. Por exemplo, o envio para inspeção só é permitido quando o parâmetro do indicador for maior que `90`; caso contrário, uma mensagem de problema relacionado será exibida:

![Exemplo_Organização da lógica de negócio](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Dica}
O nó "[Mensagem de Resposta](../nodes/response-message.md)" pode ser usado em eventos de ação personalizada síncronos para retornar informações de aviso ao cliente. Ele não pode ser usado no modo assíncrono.
:::

Após configurar e habilitar o fluxo, retorne à interface da tabela e adicione o botão "Acionar fluxo de trabalho" na coluna de ações da tabela:

![Exemplo_Adicionar botão de ação](https://static-docs.nocobase.com/20240509174525.png)

Em seguida, no menu de configuração do botão, escolha vincular o fluxo de trabalho e abra o pop-up de configuração:

![Exemplo_Abrir pop-up de vinculação de fluxo de trabalho](https://static-docs.nocobase.com/20240509174633.png)

Adicione o fluxo de trabalho habilitado anteriormente:

![Exemplo_Selecionar fluxo de trabalho](https://static-docs.nocobase.com/20240509174723.png)

Após enviar, altere o texto do botão para o nome da operação, como "Enviar para inspeção", e o processo de configuração estará concluído.

Ao usar, selecione qualquer dado de amostra na tabela e clique no botão "Enviar para inspeção" para acionar o evento de ação personalizada. Conforme a lógica organizada anteriormente, se o parâmetro do indicador da amostra for menor que 90, o seguinte aviso aparecerá após o clique:

![Exemplo_Indicador não atende ao envio](https://static-docs.nocobase.com/20240509175026.png)

Se o parâmetro do indicador for maior que 90, o fluxo será executado normalmente, gerando os dados de "Registro de inspeção" e alterando o status da amostra para "Enviado":

![Exemplo_Envio bem-sucedido](https://static-docs.nocobase.com/20240509175247.png)

Com isso, um evento de ação personalizada simples está concluído. Da mesma forma, para negócios com operações complexas, como processamento de pedidos, envio de relatórios, etc., você pode usar eventos de ação personalizada para implementá-los.

## Chamada externa

O acionamento de eventos de ação personalizada não se limita a operações na interface do usuário; ele também pode ser acionado por meio de chamadas de API HTTP. Especificamente, os eventos de ação personalizada fornecem um novo tipo de operação para todas as operações de coleção para acionar fluxos de trabalho: `trigger`, que pode ser chamado instalando a API de operação padrão do NocoBase.

:::info{title="Dica"}
Como as chamadas externas também precisam ser baseadas na identidade do usuário, ao chamar via API HTTP, as requisições são consistentes com as enviadas pela interface comum, exigindo informações de autenticação, incluindo o cabeçalho `Authorization` ou o parâmetro `token` (obtido no login), bem como o cabeçalho `X-Role` (nome da função atual do usuário).
:::

### Sem contexto

Fluxos de trabalho sem contexto precisam ser acionados para o recurso `workflows`:

```bash
curl -X POST -H 'Authorization: Bearer <seu token>' -H 'X-Role: <nomeDaFunção>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Registro único

Semelhante ao fluxo de trabalho acionado por botão no exemplo, você pode chamá-lo assim:

```bash
curl -X POST -H 'Authorization: Bearer <seu token>' -H 'X-Role: <nomeDaFunção>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Como esta operação é para um único dado, ao chamar para dados existentes, você precisa especificar o ID da linha de dados, substituindo a parte `<:id>` na URL.

Se for chamado para um formulário (como adição ou atualização), o ID pode não ser passado para o formulário de novos dados, mas os dados enviados precisam ser passados como o contexto de execução:

```bash
curl -X POST -H 'Authorization: Bearer <seu token>' -H 'X-Role: <nomeDaFunção>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Para formulários de atualização, você precisa passar o ID da linha de dados e os dados atualizados:

```bash
curl -X POST -H 'Authorization: Bearer <seu token>' -H 'X-Role: <nomeDaFunção>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Se o ID e os dados forem passados simultaneamente, a linha de dados correspondente ao ID será carregada primeiro e, em seguida, as propriedades do objeto de dados passado serão usadas para sobrescrever a linha de dados original para obter o contexto de dados do acionador final.

:::warning{title="Atenção"}
Se dados de associação forem passados, eles também serão sobrescritos. Tenha cuidado ao lidar com dados passados, especialmente quando o pré-carregamento de itens de dados de associação estiver configurado, para evitar que os dados de associação sejam sobrescritos de forma inesperada.
:::

Além disso, o parâmetro de URL `triggerWorkflows` é a chave (key) do fluxo de trabalho, e múltiplos fluxos de trabalho são separados por vírgulas. Essa chave pode ser obtida passando o mouse sobre o nome do fluxo de trabalho no topo da tela de edição do fluxo de trabalho:

![Visualização da chave do fluxo de trabalho](https://static-docs.nocobase.com/20240426135108.png)

Após o sucesso da chamada acima, o evento de ação personalizada da coleção `samples` correspondente será acionado.

:::info{title="Dica"}
Ao acionar eventos de operação via chamadas de API HTTP, você também deve prestar atenção ao status de habilitação do fluxo de trabalho e se a configuração da coleção corresponde; caso contrário, a chamada pode não ser bem-sucedida ou ocorrer um erro.
:::

### Múltiplos registros

Semelhante ao método de chamada de registro único, mas os dados passados precisam apenas de múltiplos parâmetros de chave primária (`filterByTk[]`) e não há necessidade de passar a parte `data`:

```bash
curl -X POST -H 'Authorization: Bearer <seu token>' -H 'X-Role: <nomeDaFunção>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Esta chamada acionará o evento de ação personalizada no modo de múltiplos registros e usará os dados com IDs 1 e 2 como os dados no contexto do acionador.