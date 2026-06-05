:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Autenticação

## Visão Geral

`Auth` é uma classe abstrata para tipos de autenticação de usuário. Ela define as interfaces necessárias para completar a autenticação de um usuário. Para estender um novo tipo de autenticação, você precisa herdar a classe `Auth` e implementar seus métodos. Para uma implementação básica, consulte: [BaseAuth](#).

```ts
interface IAuth {
  user: Model;
  // Verifica o status da autenticação e retorna o usuário atual.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: autenticação
  async check() {
    // ...
  }
}
```

## Propriedades de Instância

### `user`

Informações do usuário autenticado.

#### Assinatura

- `abstract user: Model`

## Métodos da Classe

### `constructor()`

Construtor, cria uma instância de `Auth`.

#### Assinatura

- `constructor(config: AuthConfig)`

#### Tipo

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Detalhes

##### AuthConfig

| Propriedade       | Tipo                                            | Descrição                                                                                                     |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Modelo de dados do autenticador. O tipo real em uma aplicação NocoBase é [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`         | `Record<string, any>`                           | Configuração relacionada ao autenticador.                                                                          |
| `ctx`             | `Context`                                       | Contexto da requisição.                                                                                       |

### `check()`

Autenticação do usuário. Retorna as informações do usuário. Este é um método abstrato que todos os tipos de autenticação devem implementar.

#### Assinatura

- `abstract check(): Promise<Model>`

### `signIn()`

Login do usuário.

#### Assinatura

- `signIn(): Promise<any>`

### `signUp()`

Registro do usuário.

#### Assinatura

- `signUp(): Promise<any>`

### `signOut()`

Logout do usuário.

#### Assinatura

- `signOut(): Promise<any>`