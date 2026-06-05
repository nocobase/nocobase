---
pkg: '@nocobase/plugin-record-history'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Histórico de Registros

## Introdução

O **plugin** de Histórico de Registros rastreia as alterações de dados, salvando automaticamente snapshots e diferenças das operações de **criação**, **atualização** e **exclusão**. Ele ajuda você a revisar rapidamente as modificações de dados e auditar as atividades de operação.

![](https://static-docs.nocobase.com/202511011338499.png)

## Habilitando o Histórico de Registros

### Adicionar Coleções e Campos

Primeiro, acesse a página de configurações do **plugin** de Histórico de Registros para adicionar as **coleções** e campos para os quais você deseja rastrear o histórico. Para melhorar a eficiência do registro e evitar redundância de dados, é recomendado rastrear apenas os campos essenciais. Campos como **ID único**, **createdAt**, **updatedAt**, **createdBy** e **updatedBy** geralmente não precisam ser registrados.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Sincronizar Snapshots de Dados Históricos

- Para registros criados antes da habilitação do rastreamento de histórico, as alterações só podem ser registradas após a primeira atualização gerar um snapshot; a atualização ou exclusão inicial não será registrada.
- Para preservar o histórico de dados existentes, você pode realizar uma sincronização de snapshot única.
- O tamanho do snapshot por **coleção** é calculado como: número de registros × número de campos rastreados.
- Para grandes conjuntos de dados, é recomendado filtrar por escopo de dados e sincronizar apenas os registros importantes.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Clique em **“Sincronizar Snapshots Históricos”**, configure os campos e o escopo de dados, e inicie a sincronização.

![](https://static-docs.nocobase.com/202511011320958.png)

A tarefa de sincronização será enfileirada e executada em segundo plano. Você pode atualizar a lista para verificar seu status de conclusão.

## Usando o Bloco de Histórico de Registros

### Adicionar um Bloco

Selecione o **Bloco de Histórico de Registros** e escolha uma **coleção** para adicionar o bloco de histórico correspondente à sua página.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Se você estiver adicionando um bloco de histórico dentro de um pop-up de detalhes de um registro, você pode selecionar **“Registro Atual”** para exibir o histórico específico desse registro.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Editar Modelos de Descrição

Clique em **“Editar Modelo”** nas configurações do bloco para configurar o texto de descrição para os registros de operação.

![](https://static-docs.nocobase.com/202511011340406.png)

Atualmente, você pode configurar modelos de descrição separados para operações de **criação**, **atualização** e **exclusão**. Para operações de atualização, você também pode configurar o modelo de descrição para alterações de campo, seja como um modelo único para todos os campos ou para campos específicos individualmente.

![](https://static-docs.nocobase.com/202511011346400.png)

Variáveis podem ser usadas ao configurar o texto.

![](https://static-docs.nocobase.com/202511011347163.png)

Após a configuração, você pode escolher aplicar o modelo a **Todos os blocos de histórico de registros da coleção atual** ou **Apenas a este bloco de histórico de registros**.

![](https://static-docs.nocobase.com/202511011348885.png)