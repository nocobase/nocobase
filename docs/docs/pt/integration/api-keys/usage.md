:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Usando Chaves de API no NocoBase

Este guia demonstra como usar Chaves de API no NocoBase para obter dados, utilizando um exemplo prático de "Tarefas" (To-Dos). Siga as instruções passo a passo abaixo para entender o fluxo de trabalho completo.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Entendendo as Chaves de API

Uma Chave de API é um token de segurança usado para autenticar requisições de API feitas por usuários autorizados. Ela funciona como uma credencial que valida a identidade de quem faz a requisição ao acessar o sistema NocoBase através de aplicações web, aplicativos móveis ou scripts de backend.

No cabeçalho de requisição HTTP, você verá um formato como:

```txt
Authorization: Bearer {API key}
```

O prefixo "Bearer" indica que a string que o segue é uma Chave de API autenticada, usada para verificar as permissões de quem faz a requisição.

### Casos de Uso Comuns

As Chaves de API são tipicamente usadas nos seguintes cenários:

1.  **Acesso por Aplicações Cliente**: Navegadores web e aplicativos móveis usam Chaves de API para autenticar a identidade do usuário, garantindo que apenas usuários autorizados possam acessar os dados.
2.  **Execução de Tarefas Automatizadas**: Processos em segundo plano e tarefas agendadas usam Chaves de API para executar com segurança atualizações, sincronização de dados e operações de registro (logging).
3.  **Desenvolvimento e Testes**: Desenvolvedores usam Chaves de API durante a depuração e testes para simular requisições autenticadas e verificar as respostas da API.

As Chaves de API oferecem múltiplos benefícios de segurança: verificação de identidade, monitoramento de uso, limitação de taxa de requisições e prevenção de ameaças, garantindo a operação estável e segura do NocoBase.

## 2 Criando Chaves de API no NocoBase

### 2.1 Ative o **Plugin** de Autenticação: Chaves de API

Certifique-se de que o **plugin** integrado [Autenticação: Chaves de API](/plugins/@nocobase/plugin-api-keys/) esteja ativado. Uma vez habilitado, uma nova página de configuração de Chaves de API aparecerá nas configurações do sistema.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Crie uma **coleção** de Teste

Para fins de demonstração, crie uma **coleção** chamada `todos` com os seguintes campos:

-   `id`
-   `título`
-   `concluído`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Adicione alguns registros de exemplo à **coleção**:

-   comer
-   dormir
-   jogar

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Crie e Atribua uma Função

As Chaves de API são vinculadas a funções de usuário, e o sistema determina as permissões de requisição com base na função atribuída. Antes de criar uma Chave de API, você deve criar uma função e configurar as permissões apropriadas. Crie uma função chamada "Função API Tarefas" e conceda a ela acesso total à **coleção** `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Se a "Função API Tarefas" não estiver disponível ao criar uma Chave de API, certifique-se de que o usuário atual tenha sido atribuído a esta função:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Após a atribuição da função, atualize a página e navegue até a página de gerenciamento de Chaves de API. Clique em "Adicionar Chave de API" para verificar se a "Função API Tarefas" aparece na seleção de funções.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Para um melhor controle de acesso, considere criar uma conta de usuário dedicada (por exemplo, "Usuário API Tarefas") especificamente para o gerenciamento e teste de Chaves de API. Atribua a "Função API Tarefas" a este usuário.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Gere e Salve a Chave de API

Após enviar o formulário, o sistema exibirá uma mensagem de confirmação com a Chave de API recém-gerada. **Importante**: Copie e armazene esta chave imediatamente em um local seguro, pois ela não será exibida novamente por motivos de segurança.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Exemplo de Chave de API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Observações Importantes

-   O período de validade da Chave de API é determinado pela configuração de expiração definida durante a criação.
-   A geração e verificação da Chave de API dependem da variável de ambiente `APP_KEY`. **Não modifique esta variável**, pois isso invalidará todas as Chaves de API existentes no sistema.

## 3 Testando a Autenticação da Chave de API

### 3.1 Usando o **Plugin** de Documentação da API

Abra o **plugin** [Documentação da API](/plugins/@nocobase/plugin-api-doc/) para visualizar os métodos de requisição, URLs, parâmetros e cabeçalhos para cada endpoint da API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Entendendo as Operações CRUD Básicas

O NocoBase oferece APIs CRUD (Create, Read, Update, Delete - Criar, Ler, Atualizar, Excluir) padrão para manipulação de dados:

-   **Consulta de Lista (API de listagem):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Cabeçalho da Requisição:
    - Authorization: Bearer <Chave de API>

    ```
-   **Criar Registro (API de criação):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Cabeçalho da Requisição:
    - Authorization: Bearer <Chave de API>

    Corpo da Requisição (formato JSON), por exemplo:
        {
            "title": "123"
        }
    ```
-   **Atualizar Registro (API de atualização):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Cabeçalho da Requisição:
    - Authorization: Bearer <Chave de API>

    Corpo da Requisição (formato JSON), por exemplo:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Excluir Registro (API de exclusão):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Cabeçalho da Requisição:
    - Authorization: Bearer <Chave de API>
    ```

Onde:
-   `{baseURL}`: URL do sistema NocoBase
-   `{collectionName}`: Nome da **coleção**

Exemplo: Para uma instância local em `localhost:13000` com uma **coleção** chamada `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testando com o Postman

Crie uma requisição GET no Postman com a seguinte configuração:
-   **URL**: O endpoint da requisição (por exemplo, `http://localhost:13000/api/todos:list`)
-   **Headers**: Adicione o cabeçalho `Authorization` com o valor:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Resposta de Sucesso:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Resposta de Erro (Chave de API Inválida/Expirada):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Solução de Problemas**: Se a autenticação falhar, verifique as permissões da função, a vinculação da Chave de API e o formato do token.

### 3.4 Exporte o Código da Requisição

O Postman permite exportar a requisição em vários formatos. Exemplo de comando cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Usando Chaves de API em um Bloco JS

O NocoBase 2.0 permite escrever código JavaScript nativo diretamente nas páginas usando blocos JS. Este exemplo demonstra como buscar dados de uma API externa usando Chaves de API.

### Criando um Bloco JS

Na sua página do NocoBase, adicione um bloco JS e use o seguinte código para buscar os dados da lista de tarefas:

```javascript
// Busca dados da lista de tarefas usando a Chave de API
async function fetchTodos() {
  try {
    // Exibe a mensagem de carregamento
    ctx.message.loading('Buscando dados...');

    // Carrega a biblioteca axios para requisições HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Falha ao carregar a biblioteca HTTP');
      return;
    }

    // Chave de API (substitua pela sua chave de API real)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Faz a requisição à API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Exibe os resultados
    console.log('Lista de Tarefas:', response.data);
    ctx.message.success(`Sucesso ao buscar ${response.data.data.length} itens`);

    // Você pode processar os dados aqui
    // Por exemplo: exibir em uma tabela, atualizar campos de formulário, etc.

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    ctx.message.error('Falha ao buscar dados: ' + error.message);
  }
}

// Executa a função
fetchTodos();
```

### Pontos Chave

-   **ctx.requireAsync()**: Carrega dinamicamente bibliotecas externas (como axios) para requisições HTTP.
-   **ctx.message**: Exibe notificações ao usuário (carregando, sucesso, mensagens de erro).
-   **Autenticação da Chave de API**: Passe a Chave de API no cabeçalho `Authorization` com o prefixo `Bearer`.
-   **Tratamento da Resposta**: Processe os dados retornados conforme necessário (exibir, transformar, etc.).

## 5 Resumo

Este guia cobriu o fluxo de trabalho completo para usar Chaves de API no NocoBase:

1.  **Configuração**: Ativar o **plugin** de Chaves de API e criar uma **coleção** de teste.
2.  **Configuração**: Criar funções com permissões apropriadas e gerar Chaves de API.
3.  **Teste**: Validar a autenticação da Chave de API usando Postman e o **plugin** de Documentação da API.
4.  **Integração**: Usar Chaves de API em blocos JS.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Recursos Adicionais:**
-   [Documentação do **Plugin** de Chaves de API](/plugins/@nocobase/plugin-api-keys/)
-   [**Plugin** de Documentação da API](/plugins/@nocobase/plugin-api-doc/)