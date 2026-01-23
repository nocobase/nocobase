:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Referência da API

## Lado do Servidor

### Auth

API do núcleo, referência: [Auth](/api/auth/auth)

### BaseAuth

API do núcleo, referência: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Visão Geral

`AuthModel` é o modelo de dados do autenticador (`Authenticator`, referência: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) e [Auth - constructor](/api/auth/auth#constructor)) usado em aplicações NocoBase. Ele oferece alguns métodos para interagir com a **coleção** de dados do usuário. Além disso, você também pode usar os métodos fornecidos pelo Sequelize Model.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### Métodos da Classe

- `findUser(uuid: string): UserModel` - Consulta um usuário pelo `uuid`.
  - `uuid` - O identificador único do usuário para o tipo de autenticação atual.

- `newUser(uuid: string, userValues?: any): UserModel` - Cria um novo usuário e o vincula ao autenticador atual usando o `uuid`.
  - `uuid` - O identificador único do usuário para o tipo de autenticação atual.
  - `userValues` - Opcional. Outras informações do usuário. Se não for fornecido, o `uuid` será usado como o apelido do usuário.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Encontra ou cria um novo usuário, seguindo as mesmas regras de criação mencionadas acima.
  - `uuid` - O identificador único do usuário para o tipo de autenticação atual.
  - `userValues` - Opcional. Outras informações do usuário.

## Lado do Cliente

### `plugin.registerType()`

Registra o cliente do tipo de autenticação.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### Assinatura

- `registerType(authType: string, options: AuthOptions)`

#### Tipo

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### Detalhes

- `SignInForm` - Formulário de login
- `SignInButton` - Botão de login (terceiro), que pode ser usado como alternativa ao formulário de login.
- `SignUpForm` - Formulário de cadastro
- `AdminSettingsForm` - Formulário de configurações do administrador.

### Rotas

O **plugin** de autenticação registra as seguintes rotas de frontend:

- Layout de Auth
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Página de Login
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Página de Cadastro
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`