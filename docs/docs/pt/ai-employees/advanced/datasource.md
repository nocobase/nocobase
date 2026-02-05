---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Avançado

## Introdução

No plugin de AI Employee, você pode configurar fontes de dados e predefinir algumas consultas de **coleção**. Essas consultas são então enviadas como contexto da aplicação ao conversar com o AI Employee, que responderá com base nos resultados das consultas da **coleção**.

## Configuração da Fonte de Dados

Acesse a página de configuração do plugin de AI Employee, clique na aba `Data source` para acessar a página de gerenciamento de fontes de dados do AI Employee.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Clique no botão `Add data source` para acessar a página de criação de fonte de dados.

Primeiro passo: Insira as informações básicas da **coleção**:
- No campo `Title`, insira um nome fácil de lembrar para a **fonte de dados**;
- No campo `Collection`, selecione a **fonte de dados** e a **coleção** a serem usadas;
- No campo `Description`, insira uma descrição para a **fonte de dados**.
- No campo `Limit`, insira o limite de consulta para a **fonte de dados** para evitar que muitos dados sejam retornados e excedam o contexto da conversa do AI.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Segundo passo: Selecione os campos a serem consultados:

Na lista `Fields`, marque os campos que você deseja consultar.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Terceiro passo: Defina as condições de consulta:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Quarto passo: Defina as condições de ordenação:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Por fim, antes de salvar a **fonte de dados**, você pode pré-visualizar os resultados da consulta da **fonte de dados**.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Enviando Fontes de Dados em Conversas

Na caixa de diálogo do AI Employee, clique no botão `Add work context` no canto inferior esquerdo, selecione `Data source`, e você verá a **fonte de dados** que acabou de adicionar.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Marque a **fonte de dados** que você deseja enviar, e a **fonte de dados** selecionada será anexada à caixa de diálogo.

![20251022105401](https://static-docs.nocobase.com/2025105401.png)

Após inserir sua pergunta, assim como ao enviar uma mensagem normal, clique no botão de envio, e o AI Employee responderá com base na **fonte de dados**.

A **fonte de dados** também aparecerá na lista de mensagens.

![20251022105611](https://static-docs.nocobase.com/2025105611.png)

## Observações

A **fonte de dados** filtrará automaticamente os dados com base nas permissões ACL do usuário atual, mostrando apenas os dados aos quais o usuário tem acesso.