---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Evento de Ação Personalizada

## Introdução

NocoBase já vem com ações de dados comuns (adicionar, excluir, atualizar, visualizar, etc.). No entanto, quando essas ações não são suficientes para atender a necessidades de negócios mais complexas, você pode usar eventos de ação personalizada em um **fluxo de trabalho**. Ao vincular esse evento a um botão "Acionar **Fluxo de Trabalho**" em um bloco de página, um **fluxo de trabalho** de ação personalizada será acionado quando o usuário clicar nele.

## Criar um **Fluxo de Trabalho**

Ao criar um **fluxo de trabalho**, selecione "Evento de Ação Personalizada":

![Criar Fluxo de Trabalho de "Evento de Ação Personalizada"](https://static-docs.nocobase.com/20240509091820.png)

## Configuração do Acionador

### Tipo de Contexto

> v.1.6.0+

O tipo de contexto define a quais botões de bloco o **fluxo de trabalho** pode ser vinculado:

*   Sem Contexto: Um evento global que pode ser vinculado a botões de ação na Barra de Ações e em blocos de dados.
*   Registro Único: Pode ser vinculado a botões de ação em blocos de dados como linhas de tabela, formulários e detalhes.
*   Múltiplos Registros: Pode ser vinculado a botões de ação em massa em uma tabela.

![Configuração do Acionador_Tipo de Contexto](https://static-docs.nocobase.com/20250215135808.png)

### **Coleção**

Quando o tipo de contexto é Registro Único ou Múltiplos Registros, você precisa selecionar a **coleção** à qual o modelo de dados será vinculado:

![Configuração do Acionador_Selecionar Coleção](https://static-docs.nocobase.com/20250215135919.png)

### Dados de Associação a Serem Usados

Se você precisar usar os dados de associação da linha de dados acionadora no **fluxo de trabalho**, pode selecionar campos de associação profundos aqui:

![Configuração do Acionador_Selecionar Dados de Associação a Serem Usados](https://static-docs.nocobase.com/20250215135955.png)

Esses campos serão automaticamente pré-carregados no contexto do **fluxo de trabalho** após o evento ser acionado, tornando-os disponíveis para uso no **fluxo de trabalho**.

## Configuração da Ação

A configuração dos botões de ação em diferentes blocos varia de acordo com o tipo de contexto configurado no **fluxo de trabalho**.

### Sem Contexto

> v.1.6.0+

Na Barra de Ações e em outros blocos de dados, você pode adicionar um botão "Acionar **Fluxo de Trabalho**":

![Adicionar Botão de Ação ao Bloco_Barra de Ações](https://static-docs.nocobase.com/20250215221738.png)

![Adicionar Botão de Ação ao Bloco_Calendário](https://static-docs.nocobase.com/20250215221942.png)

![Adicionar Botão de Ação ao Bloco_Gráfico de Gantt](https://static-docs.nocobase.com/20250215221810.png)

Após adicionar o botão, vincule o **fluxo de trabalho** sem contexto criado anteriormente. Veja um exemplo usando um botão na Barra de Ações:

![Vincular Fluxo de Trabalho ao Botão_Barra de Ações](https://static-docs.nocobase.com/20250215222120.png)

![Selecionar Fluxo de Trabalho para Vincular_Sem Contexto](https://static-docs.nocobase.com/20250215222234.png)

### Registro Único

Em qualquer bloco de dados, um botão "Acionar **Fluxo de Trabalho**" pode ser adicionado à barra de ações para um único registro, como em formulários, linhas de tabela, detalhes, etc.:

![Adicionar Botão de Ação ao Bloco_Formulário](https://static-docs.nocobase.com/20240509165428.png)

![Adicionar Botão de Ação ao Bloco_Linha da Tabela](https://static-docs.nocobase.com/20240509165340.png)

![Adicionar Botão de Ação ao Bloco_Detalhes](https://static-docs.nocobase.com/20240509165545.png)

Após adicionar o botão, vincule o **fluxo de trabalho** criado anteriormente:

![Vincular Fluxo de Trabalho ao Botão](https://static-docs.nocobase.com/20240509165631.png)

![Selecionar Fluxo de Trabalho para Vincular](https://static-docs.nocobase.com/20240509165658.png)

Em seguida, clicar neste botão acionará o evento de ação personalizada:

![Resultado de Clicar no Botão](https://static-docs.nocobase.com/20240509170453.png)

### Múltiplos Registros

> v.1.6.0+

Na barra de ações de um bloco de tabela, ao adicionar um botão "Acionar **Fluxo de Trabalho**", há uma opção adicional para selecionar o tipo de contexto: "Sem Contexto" ou "Múltiplos Registros":

![Adicionar Botão de Ação ao Bloco_Tabela](https://static-docs.nocobase.com/20250215222507.png)

Quando "Sem Contexto" é selecionado, trata-se de um evento global e só pode ser vinculado a **fluxos de trabalho** do tipo sem contexto.

Quando "Múltiplos Registros" é selecionado, você pode vincular um **fluxo de trabalho** do tipo múltiplos registros, que pode ser usado para ações em massa após selecionar vários registros (atualmente, apenas tabelas suportam isso). Os **fluxos de trabalho** disponíveis são limitados àqueles configurados para corresponder à **coleção** do bloco de dados atual:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Ao clicar no botão para acionar, algumas linhas de dados na tabela devem estar selecionadas; caso contrário, o **fluxo de trabalho** não será acionado:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Exemplo

Por exemplo, temos uma **coleção** de "Amostras". Para amostras com o status "Coletado", precisamos fornecer uma ação de "Enviar para Inspeção". Essa ação primeiro verificará as informações básicas da amostra, depois gerará um "Registro de Inspeção" e, por fim, mudará o status da amostra para "Enviado". Essa série de processos não pode ser concluída com simples cliques em botões de "adicionar, excluir, atualizar, visualizar", então um evento de ação personalizada pode ser usado para implementá-la.

Primeiro, crie uma **coleção** de "Amostras" e uma **coleção** de "Registros de Inspeção", e insira alguns dados de teste básicos na **coleção** de Amostras:

![Exemplo_Coleção de Amostras](https://static-docs.nocobase.com/20240509172234.png)

Em seguida, crie um **fluxo de trabalho** de "Evento de Ação Personalizada". Se você precisar de feedback rápido do processo da operação, pode escolher o modo síncrono (no modo síncrono, você não pode usar nós assíncronos como processamento manual):

![Exemplo_Criar Fluxo de Trabalho](https://static-docs.nocobase.com/20240509173106.png)

Na configuração do acionador, selecione "Amostras" para a **coleção**:

![Exemplo_Configuração do Acionador](https://static-docs.nocobase.com/20240509173148.png)

Organize a lógica no processo de acordo com os requisitos de negócio. Por exemplo, permita o envio para inspeção apenas quando o parâmetro do indicador for maior que `90`; caso contrário, exiba uma mensagem relevante:

![Exemplo_Organização da Lógica de Negócio](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Dica}
O nó "[Mensagem de Resposta](../nodes/response-message.md)" pode ser usado em eventos de ação personalizada síncronos para retornar uma mensagem de aviso ao cliente. Ele não pode ser usado no modo assíncrono.
:::

Após configurar e habilitar o **fluxo de trabalho**, retorne à interface da tabela e adicione um botão "Acionar **Fluxo de Trabalho**" na coluna de ações da tabela:

![Exemplo_Adicionar Botão de Ação](https://static-docs.nocobase.com/20240509174525.png)

Em seguida, no menu de configuração do botão, escolha vincular um **fluxo de trabalho** e abra a janela pop-up de configuração:

![Exemplo_Abrir Pop-up de Vincular Fluxo de Trabalho](https://static-docs.nocobase.com/20240509174633.png)

Adicione o **fluxo de trabalho** habilitado anteriormente:

![Exemplo_Selecionar Fluxo de Trabalho](https://static-docs.nocobase.com/20240509174723.png)

Após enviar, altere o texto do botão para o nome da ação, como "Enviar para Inspeção". O processo de configuração está agora completo.

Para usar, selecione qualquer dado de amostra na tabela e clique no botão "Enviar para Inspeção" para acionar o evento de ação personalizada. Conforme a lógica organizada anteriormente, se o parâmetro do indicador da amostra for menor que 90, o seguinte aviso será exibido após o clique:

![Exemplo_Indicador Não Atende aos Critérios de Envio](https://static-docs.nocobase.com/20240509175026.png)

Se o parâmetro do indicador for maior que 90, o processo será executado normalmente, gerando um "Registro de Inspeção" e alterando o status da amostra para "Enviado".

![Exemplo_Envio Bem-sucedido](https://static-docs.nocobase.com/20240509175247.png)

Com isso, um evento de ação personalizada simples está completo. Da mesma forma, para negócios com operações complexas, como processamento de pedidos ou envio de relatórios, eventos de ação personalizada podem ser usados para a implementação.

## Chamada Externa

O acionamento de eventos de ação personalizada não se limita às ações da interface do usuário; ele também pode ser acionado por meio de chamadas de API HTTP. Especificamente, os eventos de ação personalizada fornecem um novo tipo de ação para todas as ações de **coleção** para acionar **fluxos de trabalho**: `trigger`, que pode ser chamado usando a API de ação padrão do NocoBase.

Um **fluxo de trabalho** acionado por um botão, como no exemplo, pode ser chamado assim:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Como esta ação é para um único registro, ao chamá-la em dados existentes, você precisa especificar o ID da linha de dados, substituindo a parte `<:id>` na URL.

Se for chamado para um formulário (como para criar ou atualizar), você pode omitir o ID para um formulário que cria novos dados, mas deve passar os dados enviados como contexto de execução:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Para um formulário de atualização, você precisa passar tanto o ID da linha de dados quanto os dados atualizados:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Se um ID e dados forem passados simultaneamente, a linha de dados correspondente ao ID será carregada primeiro, e então as propriedades do objeto de dados passado serão usadas para sobrescrever a linha de dados original, obtendo assim o contexto final dos dados acionadores.

:::warning{title="Atenção"}
Se dados de associação forem passados, eles também serão sobrescritos. Tenha especial cautela ao lidar com dados de entrada se o pré-carregamento de itens de dados de associação estiver configurado, para evitar sobrescritas inesperadas dos dados de associação.
:::

Além disso, o parâmetro de URL `triggerWorkflows` é a chave do **fluxo de trabalho**; múltiplas chaves de **fluxo de trabalho** são separadas por vírgulas. Essa chave pode ser obtida passando o mouse sobre o nome do **fluxo de trabalho** na parte superior da tela do **fluxo de trabalho**:

![Fluxo de Trabalho_Chave_Método de Visualização](https://static-docs.nocobase.com/20240426135108.png)

Após uma chamada bem-sucedida, o evento de ação personalizada para a **coleção** `samples` correspondente será acionado.

:::info{title="Dica"}
Como as chamadas externas também precisam ser baseadas na identidade do usuário, ao chamar via API HTTP, assim como as requisições enviadas pela interface regular, você precisa fornecer informações de autenticação. Isso inclui o cabeçalho de requisição `Authorization` ou o parâmetro `token` (o token obtido no login), e o cabeçalho de requisição `X-Role` (o nome da função atual do usuário).
:::

Se você precisar acionar um evento para dados de associação um-para-um (um-para-muitos não é suportado atualmente) nesta ação, pode usar `!` no parâmetro para especificar os dados acionadores do campo de associação:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Após uma chamada bem-sucedida, o evento de ação personalizada para a **coleção** `categories` correspondente será acionado.

:::info{title="Dica"}
Ao acionar um evento de ação via chamada de API HTTP, você também precisa prestar atenção ao status de habilitação do **fluxo de trabalho** e se a configuração da **coleção** corresponde; caso contrário, a chamada pode não ser bem-sucedida ou pode resultar em um erro.
:::