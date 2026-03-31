:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Auth

## Visão Geral

A classe `Auth` é usada principalmente no lado do cliente para acessar informações do usuário e fazer requisições a APIs relacionadas à autenticação de usuários.

## Propriedades de Instância

### `locale`

O idioma utilizado pelo usuário atual.

### `role`

A função utilizada pelo usuário atual.

### `token`

O `token` da API.

### `authenticator`

O autenticador usado para a autenticação do usuário atual. Consulte [Autenticação de Usuário](/auth-verification/auth/).

## Métodos da Classe

### `signIn()`

Login do usuário.

#### Assinatura

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detalhes

| Nome do Parâmetro | Tipo     | Descrição                                          |
| ----------------- | -------- | -------------------------------------------------- |
| `values`          | `any`    | Parâmetros de requisição para a API de login.      |
| `authenticator`   | `string` | O identificador do autenticador usado para o login. |

### `signUp()`

Registro de usuário.

#### Assinatura

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detalhes

| Nome do Parâmetro | Tipo     | Descrição                                            |
| ----------------- | -------- | ---------------------------------------------------- |
| `values`          | `any`    | Parâmetros de requisição para a API de registro.     |
| `authenticator`   | `string` | O identificador do autenticador usado para o registro. |

### `signOut()`

Sair da conta.

#### Assinatura

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detalhes

| Nome do Parâmetro | Tipo     | Descrição                                              |
| ----------------- | -------- | ------------------------------------------------------ |
| `values`          | `any`    | Parâmetros de requisição para a API de saída da conta. |
| `authenticator`   | `string` | O identificador do autenticador usado para sair da conta. |