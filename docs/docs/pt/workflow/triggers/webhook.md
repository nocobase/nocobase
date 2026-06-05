---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Webhook

## Introdução

O gatilho Webhook fornece uma URL que pode ser chamada por sistemas de terceiros via requisições HTTP. Quando um evento de terceiro ocorre, ele envia uma requisição HTTP para essa URL e dispara a execução do fluxo de trabalho. É ideal para notificações iniciadas por sistemas externos, como callbacks de pagamento, mensagens, etc.

## Criando um Fluxo de Trabalho

Ao criar um fluxo de trabalho, selecione o tipo "Evento Webhook":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Observação"}
A diferença entre os fluxos de trabalho "síncronos" e "assíncronos" é que um fluxo de trabalho síncrono aguarda a conclusão da execução para retornar uma resposta. Já um fluxo de trabalho assíncrono retorna imediatamente a resposta configurada no gatilho e enfileira a execução em segundo plano.
:::

## Configuração do Gatilho

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL do Webhook

A URL do gatilho Webhook é gerada automaticamente pelo sistema e vinculada a este fluxo de trabalho. Você pode clicar no botão à direita para copiá-la e colá-la no sistema de terceiros.

Apenas o método HTTP POST é suportado; outros métodos retornarão um erro `405`.

### Segurança

Atualmente, a Autenticação Básica HTTP é suportada. Você pode habilitar esta opção e definir um nome de usuário e senha. Inclua o nome de usuário e a senha na URL do Webhook no sistema de terceiros para implementar a autenticação de segurança para o Webhook (para detalhes sobre o padrão, consulte: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Quando um nome de usuário e senha são definidos, o sistema verificará se eles correspondem aos da requisição. Se não forem fornecidos ou não corresponderem, um erro `401` será retornado.

### Analisar Dados da Requisição

Quando um terceiro chama o Webhook, os dados contidos na requisição precisam ser analisados antes de poderem ser usados no fluxo de trabalho. Após a análise, eles se tornam uma variável do gatilho que pode ser referenciada em nós subsequentes.

A análise da requisição HTTP é dividida em três partes:

1.  Cabeçalhos da Requisição

    Os cabeçalhos da requisição geralmente são pares de chave-valor simples do tipo string. Os campos de cabeçalho que você precisa usar podem ser configurados diretamente, como `Date`, `X-Request-Id`, etc.

2.  Parâmetros da Requisição

    Os parâmetros da requisição são os parâmetros de consulta na URL, como o parâmetro `query` em `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Você pode colar uma URL de exemplo completa ou apenas a parte dos parâmetros de consulta e clicar no botão de análise para analisar automaticamente os pares de chave-valor.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    A análise automática converterá a parte dos parâmetros da URL em uma estrutura JSON e gerará caminhos como `query[0]`, `query[0].a` com base na hierarquia dos parâmetros. O nome do caminho pode ser modificado manualmente se não atender às suas necessidades, mas geralmente não é necessário. O alias é o nome de exibição da variável quando usada e é opcional. A análise também gerará uma lista completa de parâmetros a partir do exemplo; você pode excluir quaisquer parâmetros que não precise usar.

3.  Corpo da Requisição

    O corpo da requisição é a parte Body da requisição HTTP. Atualmente, apenas corpos de requisição com `Content-Type` no formato `application/json` são suportados. Você pode configurar diretamente os caminhos a serem analisados, ou pode inserir um exemplo JSON e clicar no botão de análise para análise automática.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    A análise automática converterá os pares de chave-valor na estrutura JSON em caminhos. Por exemplo, `{"a": 1, "b": {"c": 2}}` gerará caminhos como `a`, `b` e `b.c`. O alias é o nome de exibição da variável quando usada e é opcional. A análise também gerará uma lista completa de parâmetros a partir do exemplo; você pode excluir quaisquer parâmetros que não precise usar.

### Configurações de Resposta

A configuração da resposta do Webhook difere entre os fluxos de trabalho síncronos e assíncronos. Para fluxos de trabalho assíncronos, a resposta é configurada diretamente no gatilho. Ao receber uma requisição Webhook, ela retorna imediatamente a resposta configurada no gatilho para o sistema de terceiros e, em seguida, executa o fluxo de trabalho. Já para fluxos de trabalho síncronos, você precisa adicionar um nó de resposta dentro do fluxo para lidar com isso de acordo com os requisitos de negócios (para detalhes, consulte: [Nó de Resposta](#nó-de-resposta)).

Normalmente, a resposta para um evento Webhook acionado assincronamente tem um código de status `200` e um corpo de resposta `ok`. Você também pode personalizar o código de status, os cabeçalhos e o corpo da resposta conforme necessário.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Nó de Resposta

Referência: [Nó de Resposta](../nodes/response.md)

## Exemplo

Em um fluxo de trabalho Webhook, você pode retornar diferentes respostas com base em diferentes condições de negócio, como mostrado na figura abaixo:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Use um nó de ramificação condicional para determinar se um determinado status de negócio é atendido. Se for, retorne uma resposta de sucesso; caso contrário, retorne uma resposta de falha.