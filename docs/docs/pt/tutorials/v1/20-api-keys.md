# Usando API Keys para Obter Dados

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Bem-vindos ao tutorial.
Neste documento, vou guiar passo a passo como usar chaves de API no NocoBase para obter dados, usando «Tarefas» como exemplo, ajudando você a entender cada detalhe. Leia com atenção e siga os passos.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Entendendo o Conceito de Chave de API

Antes de começar, precisamos esclarecer: o que é uma chave de API? É como um ingresso de entrada, usado para confirmar se a requisição de API vem de um usuário legítimo. Quando você acessa o sistema NocoBase via página web, app móvel ou script de backend, essa "chave secreta" ajuda o sistema a validar rapidamente sua identidade.

No header HTTP, vemos esse formato:

```txt
Authorization: Bearer {chave de API}
```

Aqui «Bearer» indica que o que vem depois é uma chave de API validada, permitindo confirmar rapidamente as permissões do solicitante.

Em uso prático, chaves de API são comumente usadas em:

1. **Acesso de aplicação cliente**: quando o usuário chama API via navegador ou app móvel, o sistema usa a chave para validar a identidade, garantindo que só usuários autorizados obtenham os dados.
2. **Execução de tarefas automatizadas**: tarefas agendadas ou scripts em backend que atualizam dados ou registram logs usam a chave para garantir segurança e legitimidade da requisição.
3. **Desenvolvimento e testes**: desenvolvedores em depuração usam a chave para simular requisições reais, garantindo que a interface responde corretamente.

Em resumo, a chave de API ajuda a confirmar a identidade do solicitante, monitorar chamadas, limitar a frequência de requisições e prevenir ameaças de segurança, garantindo a operação estável do NocoBase.

## 2 Criar Chave de API no NocoBase

### 2.1 Habilitar plugin de [Chave de API](https://docs-cn.nocobase.com/handbook/api-keys)

Primeiro, garanta que o plugin embutido «Autenticação: Chave de API» está habilitado. Após habilitar, na central de configurações do sistema aparece uma página de configuração da [Chave de API](https://docs-cn.nocobase.com/handbook/api-keys).

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Criar tabela de tarefas para teste

Para facilitar o teste, criamos antecipadamente uma tabela chamada `Tabela de tarefas (todos)`, com os campos:

- `id`
- `título (title)`
- `concluído (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

E nessa tabela adicionamos algumas tarefas, por exemplo:

- Comer
- Dormir
- Jogar

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Criar e vincular role

Como a chave de API está vinculada à role do usuário, o sistema usa a role para julgar a permissão da requisição. Por isso, antes de criar a chave, precisamos criar uma role com as permissões adequadas.
Recomenda-se criar uma role de teste chamada «Role de API de tarefas», dando a essa role todas as permissões da tabela de tarefas.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Se ao criar a chave de API não for possível selecionar «Role de API do sistema de tarefas», é porque o usuário atual ainda não tem essa role. Atribua a role ao usuário primeiro:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Após atribuir, atualize a página, vá à página de gerenciamento de chaves de API, clique em «Adicionar chave de API» — você verá «Role de API do sistema de tarefas».

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Para uma gestão mais precisa, podemos criar um «Usuário de API de tarefas» dedicado para fazer login e gerenciar chaves de API; basta atribuir a esse usuário só a «Role de API de tarefas».
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Criar e salvar chave de API

Após clicar em submeter, o sistema mostra um aviso de que a chave foi criada com sucesso, exibindo a chave no popup. Copie e salve essa chave — por questões de segurança, o sistema não a mostrará novamente.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Por exemplo, você pode obter algo como:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Atenções

- A validade da chave depende da duração escolhida no momento da criação.
- A lógica de geração e verificação da chave está intimamente ligada à variável de ambiente `APP_KEY` — não a modifique aleatoriamente, ou todas as chaves do sistema serão invalidadas.

## 3 Testar a Validade da Chave de API

### 3.1 Usar plugin de [Documentação de API](https://docs-cn.nocobase.com/handbook/api-doc)

Abra o plugin de Documentação de API; você pode ver o método de requisição, endereço, parâmetros e header de cada API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Conhecer interfaces básicas de CRUD

Aqui estão exemplos básicos de API do NocoBase:

- **Listar (interface list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Header:
  - Authorization: Bearer <Chave de API>

  ```
- **Adicionar registro (interface create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Header:
  - Authorization: Bearer <Chave de API>

  Body (JSON), por exemplo:
      {
          "title": "123"
      }
  ```
- **Atualizar registro (interface update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Header:
  - Authorization: Bearer <Chave de API>

  Body (JSON), por exemplo:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Excluir registro (interface delete):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Header:
  - Authorization: Bearer <Chave de API>
  ```

Onde `{baseURL}` é o endereço do seu sistema NocoBase e `{collectionName}` é o nome da tabela. Por exemplo, em teste local com endereço `localhost:13000` e tabela `todos`, o endereço de requisição é:

```txt
http://localhost:13000/todos:list
```

### 3.3 Testar com Postman (exemplo: interface List)

Abra o Postman, crie uma requisição GET, insira o endereço acima, e adicione `Authorization` no header com sua chave de API:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
Após enviar, se tudo estiver OK, você recebe uma resposta como:

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

Se a chave de API não estiver corretamente autorizada, você pode ver:

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

Nesse caso, verifique as permissões da role, o vínculo da chave de API e o formato da chave.

### 3.4 Copiar código da requisição no Postman

Após o teste bem-sucedido, copie o código da requisição List. Por exemplo, o curl abaixo foi copiado do Postman:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Exibir Tarefas em [Bloco iframe](https://docs-cn.nocobase.com/handbook/block-iframe)

Para experimentar de forma mais visual o efeito da requisição de API, podemos exibir a lista de tarefas obtida do NocoBase em uma página HTML simples. Veja o código de exemplo:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

O código acima exibe uma simples «Todo List» no bloco iframe; ao carregar a página, ele chama a API para obter as tarefas e exibe o resultado em formato JSON.

Pela animação abaixo, você consegue ver o efeito dinâmico de toda a requisição:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Conclusão

Com os passos acima, explicamos em detalhe como criar e usar chaves de API no NocoBase. Da habilitação do plugin, criação de tabela, vinculação de role, testando a interface e exibindo dados em bloco iframe — cada passo é importante. Por fim, com a ajuda do DeepSeek, implementamos uma simples página de tarefas. Você pode modificar e estender o código conforme suas necessidades.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[O código da página deste exemplo](https://forum.nocobase.com/t/api-api-key/3314) já está disponível em um post da comunidade — fique à vontade para consultar e discutir. Esperamos que esta documentação tenha te dado uma orientação clara. Bom aprendizado e boas operações!
