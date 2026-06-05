:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# BaseAuth

## Visão Geral

`BaseAuth` herda da classe abstrata [Auth](./auth) e é a implementação básica para tipos de autenticação de usuário, utilizando JWT como método de autenticação. Na maioria dos casos, você pode estender os tipos de autenticação de usuário herdando de `BaseAuth`, e não há necessidade de herdar diretamente da classe abstrata `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Define a coleção de usuários
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Lógica de autenticação do usuário, chamada por `auth.signIn`
  // Retorna os dados do usuário
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Métodos da Classe

### `constructor()`

Construtor, cria uma instância de `BaseAuth`.

#### Assinatura

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Detalhes

| Parâmetro        | Tipo         | Descrição                                                                                                |
| :--------------- | :----------- | :------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Veja [Auth - AuthConfig](./auth#authconfig)                                                              |
| `userCollection` | `Collection` | Coleção de usuários, por exemplo: `db.getCollection('users')`. Veja [DataBase - Collection](../database/collection) |

### `user()`

Acessor, define e obtém informações do usuário. Por padrão, ele usa o objeto `ctx.state.currentUser` para acesso.

#### Assinatura

- `set user()`
- `get user()`

### `check()`

Autentica via token de requisição e retorna as informações do usuário.

### `signIn()`

Login do usuário, gera um token.

### `signUp()`

Registro de usuário.

### `signOut()`

Logout do usuário, expira o token.

### `validate()` \*

Lógica central de autenticação, chamada pela interface `signIn`, para determinar se o usuário pode fazer login com sucesso.