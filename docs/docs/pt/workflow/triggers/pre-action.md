---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Evento Antes da Ação

## Introdução

O plugin Evento Antes da Ação oferece um mecanismo de interceptação para ações, que pode ser acionado após a submissão de uma requisição para criar, atualizar ou excluir, mas antes que ela seja processada.

Se um nó "Encerrar fluxo de trabalho" for executado no fluxo de trabalho acionado, ou se qualquer outro nó falhar (devido a um erro ou outra situação de não conclusão), a ação do formulário será interceptada. Caso contrário, a ação pretendida será executada normalmente.

Usá-lo em conjunto com o nó "Mensagem de resposta" permite configurar uma mensagem de resposta para ser retornada ao cliente, fornecendo avisos apropriados. Eventos Antes da Ação podem ser usados para validação de negócios ou verificações lógicas, a fim de aprovar ou interceptar requisições de criação, atualização e exclusão enviadas pelo cliente.

## Configuração do Acionador

### Criar Acionador

Ao criar um fluxo de trabalho, selecione o tipo "Evento Antes da Ação":

![Criar Evento Antes da Ação](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Selecionar Coleção

No acionador de um fluxo de trabalho de interceptação, a primeira coisa a configurar é a **coleção** correspondente à ação:

![Configuração do Evento Interceptor_Coleção](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Em seguida, selecione o modo de interceptação. Você pode optar por interceptar apenas o botão de ação vinculado a este **fluxo de trabalho**, ou interceptar todas as ações selecionadas para esta **coleção** (independentemente do formulário de origem e sem a necessidade de vincular o **fluxo de trabalho** correspondente):

### Modo de Interceptação

![Configuração do Evento Interceptor_Modo de Interceptação](https://static-docs.nocobase.com/145a7f7c3db440bb6ca93a5ee84f16e2.png)

Os tipos de ação atualmente suportados são "Criar", "Atualizar" e "Excluir". Vários tipos de ação podem ser selecionados simultaneamente.

## Configuração da Ação

Se o modo "Acionar interceptação apenas quando um formulário vinculado a este **fluxo de trabalho** for enviado" for selecionado na configuração do acionador, você também precisará retornar à interface do formulário e vincular este **fluxo de trabalho** ao botão de ação correspondente:

![Adicionar Pedido_Vincular Fluxo de Trabalho](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Na configuração de vínculo do **fluxo de trabalho**, selecione o **fluxo de trabalho** correspondente. Geralmente, o contexto padrão para acionar dados, "Dados do formulário inteiro", é suficiente:

![Selecionar Fluxo de Trabalho para Vincular](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Dica}
Os botões que podem ser vinculados a um Evento Antes da Ação atualmente suportam apenas os botões "Enviar" (ou "Salvar"), "Atualizar dados" e "Excluir" em formulários de criação ou atualização. O botão "Acionar fluxo de trabalho" não é suportado (ele só pode ser vinculado a um "Evento Após a Ação").
:::

## Condições para Interceptação

Em um "Evento Antes da Ação", existem duas condições que farão com que a ação correspondente seja interceptada:

1. O **fluxo de trabalho** executa até qualquer nó "Encerrar fluxo de trabalho". Similar às instruções anteriores, quando os dados que acionaram o **fluxo de trabalho** não atendem às condições predefinidas em um nó "Condição", ele entrará no ramo "Não" e executará o nó "Encerrar fluxo de trabalho". Neste ponto, o **fluxo de trabalho** será encerrado e a ação solicitada será interceptada.
2. Qualquer nó no **fluxo de trabalho** falha na execução, incluindo erros de execução ou outras exceções. Neste caso, o **fluxo de trabalho** será encerrado com um status correspondente, e a ação solicitada também será interceptada. Por exemplo, se o **fluxo de trabalho** chamar dados externos via uma "Requisição HTTP" e a requisição falhar, o **fluxo de trabalho** terminará com um status de falha e também interceptará a requisição de ação correspondente.

Após as condições de interceptação serem atendidas, a ação correspondente não será mais executada. Por exemplo, se o envio de um pedido for interceptado, os dados do pedido correspondente não serão criados.

## Parâmetros Relacionados para a Ação Correspondente

Em um **fluxo de trabalho** do tipo "Evento Antes da Ação", diferentes dados do acionador podem ser usados como variáveis no **fluxo de trabalho** para diferentes ações:

| Tipo de Ação \ Variável | "Operador" | "Identificador de função do operador" | Parâmetro da ação: "ID" | Parâmetro da ação: "Objeto de dados enviado" |
| :---------------------- | :--------: | :--------------------------------: | :--------------------: | :---------------------------------------: |
| Criar um registro       |     ✓      |                 ✓                  |           -            |                     ✓                     |
| Atualizar um registro   |     ✓      |                 ✓                  |           ✓            |                     ✓                     |
| Excluir um ou vários registros |     ✓      |                 ✓                  |           ✓            |                     -                     |

:::info{title=Dica}
A variável "Dados do acionador / Parâmetros da ação / Objeto de dados enviado" em um Evento Antes da Ação não é o dado real do banco de dados, mas sim os parâmetros enviados com a ação. Se você precisar dos dados reais do banco de dados, deverá consultá-los usando um nó "Consultar dados" dentro do **fluxo de trabalho**.

Além disso, para uma ação de exclusão, o "ID" nos parâmetros da ação é um valor único ao direcionar um único registro, mas é um array ao direcionar múltiplos registros.
:::

## Mensagem de Resposta de Saída

Após configurar o acionador, você pode personalizar a lógica de decisão relevante no **fluxo de trabalho**. Tipicamente, você usará o modo de ramificação do nó "Condição" para decidir se deve "Encerrar fluxo de trabalho" e retornar uma "Mensagem de resposta" predefinida com base nos resultados das condições de negócio específicas:

![Configuração do Fluxo de Trabalho do Interceptor](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

A este ponto, a configuração do **fluxo de trabalho** correspondente está completa. Agora você pode tentar enviar dados que não atendam às condições configuradas no nó de condição do **fluxo de trabalho** para acionar a lógica de interceptação do interceptador. Você verá então a mensagem de resposta retornada:

![Mensagem de Resposta de Erro](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Status da Mensagem de Resposta

Se o nó "Encerrar fluxo de trabalho" for configurado para sair com um status de "Sucesso", a requisição da ação ainda será interceptada quando este nó for executado, mas a mensagem de resposta retornada será exibida com um status de "Sucesso" (em vez de "Erro"):

![Mensagem de Resposta de Status de Sucesso](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Exemplo

Combinando as instruções básicas acima, vamos usar um cenário de "Envio de Pedido" como exemplo. Suponha que precisamos verificar o estoque de todos os produtos selecionados pelo usuário ao enviar um pedido. Se o estoque de qualquer produto selecionado for insuficiente, o envio do pedido será interceptado e uma mensagem de aviso correspondente será retornada. O **fluxo de trabalho** fará um loop e verificará cada produto até que o estoque de todos os produtos seja suficiente, momento em que prosseguirá e criará os dados do pedido para o usuário.

Outras etapas são as mesmas das instruções. No entanto, como um pedido envolve vários produtos, além de adicionar um relacionamento muitos-para-muitos "Pedido" <-- M:1 -- "Item do Pedido" -- 1:M --> "Produto" no modelo de dados, você também precisa adicionar um nó "Loop" no **fluxo de trabalho** "Evento Antes da Ação" para verificar iterativamente se o estoque de cada produto é suficiente:

![Exemplo_Fluxo de Trabalho de Verificação de Loop](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e2.png)

O objeto para o loop é selecionado como o array "Item do Pedido" dos dados do pedido enviados:

![Exemplo_Configuração do Objeto de Loop](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

O nó de condição dentro do loop é usado para determinar se o estoque do objeto do produto atual no loop é suficiente:

![Exemplo_Condição no Loop](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Outras configurações são as mesmas do uso básico. Quando o pedido é finalmente enviado, se qualquer produto tiver estoque insuficiente, o envio do pedido será interceptado e uma mensagem de aviso correspondente será retornada. Durante o teste, tente enviar um pedido com vários produtos, onde um tem estoque insuficiente e outro tem estoque suficiente. Você pode ver a mensagem de resposta retornada:

![Exemplo_Mensagem de Resposta após o Envio](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Como você pode ver, a mensagem de resposta não indica que o primeiro produto, "iPhone 15 pro", está fora de estoque, mas apenas que o segundo produto, "iPhone 14 pro", está. Isso ocorre porque, no loop, o primeiro produto tem estoque suficiente, então não é interceptado, enquanto o segundo produto tem estoque insuficiente, o que intercepta o envio do pedido.

## Invocação Externa

O Evento Antes da Ação é injetado durante a fase de processamento da requisição, portanto, também suporta ser acionado por chamadas de API HTTP.

Para **fluxos de trabalho** que estão vinculados localmente a um botão de ação, você pode chamá-los assim (usando o botão de criação da **coleção** `posts` como exemplo):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

O parâmetro de URL `triggerWorkflows` é a chave do **fluxo de trabalho**; várias chaves de **fluxo de trabalho** são separadas por vírgulas. Essa chave pode ser obtida passando o mouse sobre o nome do **fluxo de trabalho** na parte superior da tela do **fluxo de trabalho**:

![Fluxo de Trabalho_Chave_Método de Visualização](https://static-docs.nocobase.com/20240426135108.png)

Após a chamada acima ser feita, o Evento Antes da Ação para a **coleção** `posts` correspondente será acionado. Após o **fluxo de trabalho** correspondente ser processado de forma síncrona, os dados serão criados e retornados normalmente.

Se o **fluxo de trabalho** configurado atingir um "nó de término", a lógica é a mesma de uma ação de interface: a requisição será interceptada e nenhum dado será criado. Se o status do nó de término for configurado como falha, o código de status da resposta retornada será `400`; se for sucesso, será `200`.

Se um nó "Mensagem de resposta" também for configurado antes do nó de término, a mensagem gerada também será retornada no resultado da resposta. A estrutura para um erro é:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

A estrutura da mensagem quando o "nó de término" é configurado para sucesso é:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Dica}
Como múltiplos nós "Mensagem de resposta" podem ser adicionados em um **fluxo de trabalho**, a estrutura de dados da mensagem retornada é um array.
:::

Se o Evento Antes da Ação for configurado no modo global, você não precisará usar o parâmetro de URL `triggerWorkflows` para especificar o **fluxo de trabalho** correspondente ao chamar a API HTTP. Basta chamar a ação da **coleção** correspondente para acioná-lo.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Dica"}
Ao acionar um evento antes da ação via uma chamada de API HTTP, você também precisa prestar atenção ao status de ativação do **fluxo de trabalho** e se a configuração da **coleção** corresponde, caso contrário, a chamada pode não ser bem-sucedida ou pode ocorrer um erro.
:::