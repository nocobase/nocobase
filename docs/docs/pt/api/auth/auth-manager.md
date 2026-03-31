:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# AuthManager

## Visão Geral

`AuthManager` é o módulo de gerenciamento de autenticação de usuários no NocoBase, usado para registrar diferentes tipos de autenticação de usuário.

### Uso Básico

```ts
const authManager = new AuthManager({
  // Usado para obter o identificador do autenticador atual do cabeçalho da requisição
  authKey: 'X-Authenticator',
});

// Define os métodos para o AuthManager armazenar e recuperar autenticadores
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registra um tipo de autenticação
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Usa o middleware de autenticação
app.resourceManager.use(authManager.middleware());
```

### Conceitos

- **Tipo de Autenticação (`AuthType`)**: Diferentes métodos de autenticação de usuário, como: senha, SMS, OIDC, SAML, etc.
- **Autenticador (`Authenticator`)**: A entidade para um método de autenticação, que é realmente armazenada em uma **coleção**, correspondendo a um registro de configuração de um determinado `AuthType`. Um método de autenticação pode ter vários autenticadores, correspondendo a várias configurações, fornecendo diferentes métodos de autenticação de usuário.
- **Identificador do Autenticador (`Authenticator name`)**: O identificador único para um autenticador, usado para determinar o método de autenticação para a requisição atual.

## Métodos de Classe

### `constructor()`

Construtor, cria uma instância de `AuthManager`.

#### Assinatura

- `constructor(options: AuthManagerOptions)`

#### Tipos

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### Detalhes

##### AuthManagerOptions

| Propriedade | Tipo                        | Descrição                                                              | Padrão            |
| ----------- | --------------------------- | ---------------------------------------------------------------------- | ----------------- |
| `authKey`   | `string`                    | Opcional, a chave no cabeçalho da requisição que contém o identificador do autenticador atual. | `X-Authenticator` |
| `default`   | `string`                    | Opcional, o identificador do autenticador padrão.                      | `basic`           |
| `jwt`       | [`JwtOptions`](#jwtoptions) | Opcional, pode ser configurado se estiver usando JWT para autenticação. | -                 |

##### JwtOptions

| Propriedade | Tipo     | Descrição                | Padrão            |
| ----------- | -------- | ------------------------ | ----------------- |
| `secret`    | `string` | Segredo do token         | `X-Authenticator` |
| `expiresIn` | `string` | Opcional, tempo de expiração do token. | `7d`              |

### `setStorer()`

Define os métodos para armazenar e recuperar dados do autenticador.

#### Assinatura

- `setStorer(storer: Storer)`

#### Tipos

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### Detalhes

##### Authenticator

| Propriedade | Tipo                  | Descrição                      |
| ----------- | --------------------- | ------------------------------ |
| `authType`  | `string`              | Tipo de autenticação           |
| `options`   | `Record<string, any>` | Configuração relacionada ao autenticador |

##### Storer

`Storer` é a interface para armazenamento de autenticadores, contendo um método.

- `get(name: string): Promise<Authenticator>` - Obtém um autenticador pelo seu identificador. No NocoBase, o tipo retornado real é [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registra um tipo de autenticação.

#### Assinatura

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Tipos

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // A classe de autenticação.
  title?: string; // O nome de exibição do tipo de autenticação.
};
```

#### Detalhes

| Propriedade | Tipo               | Descrição                                       |
| ----------- | ------------------ | ----------------------------------------------- |
| `auth`      | `AuthExtend<Auth>` | A implementação do tipo de autenticação, veja [Auth](./auth) |
| `title`     | `string`           | Opcional. O título deste tipo de autenticação exibido no frontend. |

### `listTypes()`

Obtém a lista de tipos de autenticação registrados.

#### Assinatura

- `listTypes(): { name: string; title: string }[]`

#### Detalhes

| Propriedade | Tipo     | Descrição                        |
| ----------- | -------- | -------------------------------- |
| `name`      | `string` | Identificador do tipo de autenticação |
| `title`     | `string` | Título do tipo de autenticação   |

### `get()`

Obtém um autenticador.

#### Assinatura

- `get(name: string, ctx: Context)`

#### Detalhes

| Propriedade | Tipo      | Descrição                      |
| ----------- | --------- | ------------------------------ |
| `name`      | `string`  | Identificador do autenticador |
| `ctx`       | `Context` | Contexto da requisição         |

### `middleware()`

Middleware de autenticação. Obtém o autenticador atual e realiza a autenticação do usuário.