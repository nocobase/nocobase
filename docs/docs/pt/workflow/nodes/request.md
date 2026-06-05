---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Requisição HTTP

## Introdução

Quando você precisa interagir com outro sistema web, pode usar o nó de Requisição HTTP. Ao ser executado, este nó envia uma requisição HTTP para o endereço especificado, de acordo com sua configuração. Ele pode transportar dados nos formatos JSON ou `application/x-www-form-urlencoded` para interagir com sistemas externos.

Se você já está familiarizado com ferramentas de envio de requisições como o Postman, vai dominar rapidamente o uso do nó de Requisição HTTP. Diferente dessas ferramentas, todos os parâmetros no nó de Requisição HTTP podem usar variáveis de contexto do fluxo de trabalho atual, permitindo uma integração orgânica com os processos de negócio do sistema.

## Instalação

Plugin integrado, não requer instalação.

## Criando um Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição (“+”) no fluxo para adicionar um nó de "Requisição HTTP":

![HTTP Requisição_Adicionar](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Configuração do Nó

![Nó de Requisição HTTP_Configuração](https://static-docs.nocobase.com/2fcb29af66d869c80f8fbd362a54e644.png)

### Método da Requisição

Métodos de requisição HTTP opcionais: `GET`, `POST`, `PUT`, `PATCH` e `DELETE`.

### URL da Requisição

A URL do serviço HTTP, que deve incluir a parte do protocolo (`http://` ou `https://`). Recomenda-se usar `https://`.

### Formato dos Dados da Requisição

Este é o `Content-Type` no cabeçalho da requisição. Para os formatos suportados, consulte a seção "[Corpo da Requisição](#corpo-da-requisicao)".

### Configuração do Cabeçalho da Requisição

Pares de chave-valor para a seção de Cabeçalho da requisição. Os valores podem usar variáveis do contexto do fluxo de trabalho.

:::info{title=Dica}
O cabeçalho de requisição `Content-Type` é configurado através do formato dos dados da requisição. Não é necessário preenchê-lo aqui, e qualquer tentativa de sobrescrever será ineficaz.
:::

### Parâmetros da Requisição

Pares de chave-valor para a seção de query da requisição. Os valores podem usar variáveis do contexto do fluxo de trabalho.

### Corpo da Requisição

A parte do Corpo da requisição. Diferentes formatos são suportados dependendo do `Content-Type` selecionado.

#### `application/json`

Suporta texto no formato JSON padrão. Você pode inserir variáveis do contexto do fluxo de trabalho usando o botão de variável no canto superior direito do editor de texto.

:::info{title=Dica}
As variáveis devem ser usadas dentro de uma string JSON, por exemplo: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Formato de pares de chave-valor. Os valores podem usar variáveis do contexto do fluxo de trabalho. Quando variáveis são incluídas, elas serão interpretadas como um template de string e concatenadas no valor final da string.

#### `application/xml`

Suporta texto no formato XML padrão. Você pode inserir variáveis do contexto do fluxo de trabalho usando o botão de variável no canto superior direito do editor de texto.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Suporta pares de chave-valor para dados de formulário. Arquivos podem ser enviados quando o tipo de dado é definido como um objeto de arquivo. Os arquivos só podem ser selecionados via variáveis a partir de objetos de arquivo existentes no contexto, como os resultados de uma consulta em uma coleção de arquivos ou dados relacionados de uma coleção de arquivos associada.

:::info{title=Dica}
Ao selecionar dados de arquivo, certifique-se de que a variável corresponde a um único objeto de arquivo, e não a uma lista de arquivos (em uma consulta de relacionamento um-para-muitos ou muitos-para-muitos, o valor do campo de relacionamento será um array).
:::

### Configurações de Tempo Limite

Quando uma requisição não responde por um longo período, a configuração de tempo limite pode ser usada para cancelar sua execução. Se a requisição atingir o tempo limite, o fluxo de trabalho atual será encerrado prematuramente com um status de falha.

### Ignorar Falhas

O nó de requisição considera os códigos de status HTTP padrão entre `200` e `299` (inclusive) como sucesso, e todos os outros como falha. Se a opção "Ignorar requisições falhas e continuar o fluxo de trabalho" estiver marcada, os nós subsequentes no fluxo de trabalho continuarão a ser executados mesmo que a requisição falhe.

## Usando o Resultado da Resposta

O resultado da resposta de uma requisição HTTP pode ser analisado pelo nó de [Consulta JSON](./json-query.md) para uso em nós subsequentes.

A partir da versão `v1.0.0-alpha.16`, três partes do resultado da resposta do nó de requisição podem ser usadas como variáveis separadas:

*   Código de status da resposta
*   Cabeçalhos da resposta
*   Dados da resposta

![Nó de Requisição HTTP_Usando o Resultado da Resposta](https://static-docs.nocobase.com/20240529110610.png)

O código de status da resposta é geralmente um código de status HTTP padrão em formato numérico, como `200`, `403`, etc. (fornecido pelo provedor do serviço).

Os cabeçalhos da resposta (Response headers) estão em formato JSON. Tanto os cabeçalhos quanto os dados da resposta em formato JSON ainda precisam ser analisados usando um nó JSON antes de serem utilizados.

## Exemplo

Por exemplo, podemos usar o nó de requisição para integrar com uma plataforma de nuvem para enviar SMS de notificação. A configuração para uma API de SMS da Alibaba Cloud pode ser semelhante à seguinte (você precisará consultar a documentação específica da API para adaptar os parâmetros):

![Nó de Requisição HTTP_Configuração](https://static-docs.nocobase.com/20240515124004.png)

Quando o fluxo de trabalho acionar este nó, ele chamará a API de SMS da Alibaba Cloud com o conteúdo configurado. Se a requisição for bem-sucedida, um SMS será enviado através do serviço de SMS na nuvem.