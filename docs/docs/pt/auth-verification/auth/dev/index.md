:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estender Tipos de Autenticação

## Visão Geral

O NocoBase permite que você estenda os tipos de autenticação de usuário conforme a sua necessidade. Geralmente, a autenticação de usuário se divide em dois tipos: um em que a identidade do usuário é verificada dentro do próprio aplicativo NocoBase (como login por senha, login por SMS, etc.); e outro em que serviços de terceiros verificam a identidade do usuário e notificam o aplicativo NocoBase do resultado através de callbacks (como métodos de autenticação OIDC, SAML, etc.). O processo de autenticação para esses dois tipos diferentes no NocoBase é basicamente o seguinte:

### Sem Dependência de Callbacks de Terceiros

1. O cliente utiliza o SDK do NocoBase para chamar a interface de login `api.auth.signIn()`, solicitando a interface de login `auth:signIn`. Ao mesmo tempo, ele envia o identificador do autenticador em uso no cabeçalho da requisição `X-Authenticator` para o backend.
2. A interface `auth:signIn`, com base no identificador do autenticador presente no cabeçalho da requisição, encaminha a solicitação para o tipo de autenticação correspondente. O método `validate` da classe de autenticação registrada para esse tipo então realiza o processamento lógico adequado.
3. O cliente recebe as informações do usuário e o `token` de autenticação da resposta da interface `auth:signIn`, salva o `token` no Local Storage e conclui o login. Esta etapa é tratada automaticamente internamente pelo SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Com Dependência de Callbacks de Terceiros

1. O cliente obtém a URL de login de terceiros através de uma interface registrada por ele mesmo (por exemplo, `auth:getAuthUrl`), e envia informações como o nome do aplicativo e o identificador do autenticador, conforme o protocolo.
2. Redireciona para a URL de terceiros para completar o login. O serviço de terceiros chama a interface de callback do aplicativo NocoBase (que precisa ser registrada por você, por exemplo, `auth:redirect`), retorna o resultado da autenticação e também o nome do aplicativo, o identificador do autenticador, entre outras informações.
3. No método da interface de callback, os parâmetros são analisados para obter o identificador do autenticador. Em seguida, a classe de autenticação correspondente é obtida através do `AuthManager`, e o método `auth.signIn()` é chamado ativamente. O método `auth.signIn()` por sua vez chamará o método `validate()` para lidar com a lógica de autenticação.
4. Após o método de callback obter o `token` de autenticação, ele redireciona (com status 302) de volta para a página do frontend, levando o `token` e o identificador do autenticador nos parâmetros da URL, como `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

A seguir, vamos explicar como registrar interfaces do lado do servidor e interfaces de usuário do lado do cliente.

## Servidor

### Interface de Autenticação

O kernel do NocoBase oferece o registro e o gerenciamento para estender os tipos de autenticação. Para implementar a lógica central de um `plugin` de login estendido, você precisa herdar a classe abstrata `Auth` do kernel e implementar as interfaces padrão correspondentes.  
Para a API completa, consulte [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

O kernel também registra operações básicas de recursos relacionadas à autenticação de usuário.

| API            | Descrição                      |
| -------------- | ------------------------------ |
| `auth:check`   | Verifica se o usuário está logado |
| `auth:signIn`  | Fazer login                    |
| `auth:signUp`  | Registrar                      |
| `auth:signOut` | Sair da conta                  |

Na maioria dos casos, os tipos de autenticação de usuário estendidos podem reutilizar a lógica de autenticação JWT existente para gerar credenciais de acesso à API para o usuário. A classe `BaseAuth` no kernel oferece uma implementação básica da classe abstrata `Auth`. Consulte [BaseAuth](../../../api/auth/base-auth.md). Os `plugins` podem herdar diretamente a classe `BaseAuth` para reutilizar parte do código lógico e reduzir os custos de desenvolvimento.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Define a coleção de usuários
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementa a lógica de autenticação do usuário
  async validate() {}
}
```

### Dados do Usuário

Ao implementar a lógica de autenticação de usuário, geralmente há o tratamento de dados do usuário. Em um aplicativo NocoBase, as `coleções` relacionadas são definidas por padrão da seguinte forma:

| Coleções              | Descrição                                                                                                    | Plugin                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `users`               | Armazena informações do usuário, como e-mail, apelido e senha                                                | [`Plugin` de Usuário (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Armazena informações do autenticador (entidade do tipo de autenticação), correspondendo ao tipo e configuração | `Plugin` de Autenticação de Usuário (`@nocobase/plugin-auth`)     |
| `usersAuthenticators` | Associa usuários e autenticadores, salva informações do usuário sob o autenticador correspondente            | `Plugin` de Autenticação de Usuário (`@nocobase/plugin-auth`)     |

Geralmente, para métodos de login estendidos, você pode usar as `coleções` `users` e `usersAuthenticators` para armazenar os dados do usuário. Apenas em casos especiais será necessário adicionar uma nova `coleção`.

Os principais campos de `usersAuthenticators` são:

| Campo           | Descrição                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------- |
| `uuid`          | Identificador único do usuário para este tipo de autenticação, como número de telefone ou ID de usuário de serviço de terceiros |
| `meta`          | Campo JSON, outras informações a serem salvas                                             |
| `userId`        | ID do usuário                                                                             |
| `authenticator` | Nome do autenticador (identificador único)                                                |

Para operações de consulta e criação de usuários, o modelo de dados `AuthModel` dos `authenticators` também encapsula vários métodos que podem ser usados na classe `CustomAuth` através de `this.authenticator[nomeDoMetodo]`. Para a API completa, consulte [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Consulta o usuário
    this.authenticator.newUser(); // Cria um novo usuário
    this.authenticator.findOrCreateUser(); // Consulta ou cria um novo usuário
    // ...
  }
}
```

### Registro de Tipo de Autenticação

O método de autenticação estendido precisa ser registrado no módulo de gerenciamento de autenticação.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Cliente

A interface de usuário do cliente é registrada através da interface `registerType` fornecida pelo cliente do `plugin` de autenticação de usuário:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Formulário de login
        SignInButton, // Botão de login (terceiro), pode ser uma alternativa ao formulário de login
        SignUpForm, // Formulário de registro
        AdminSettingsForm, // Formulário de configurações do administrador
      },
    });
  }
}
```

### Formulário de Login

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Se vários autenticadores, correspondentes a diferentes tipos de autenticação, tiverem formulários de login registrados, eles serão exibidos em formato de abas (Tabs). O título da aba será o título do autenticador configurado no painel administrativo.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Botão de Login

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Geralmente é um botão de login de terceiros, mas pode ser qualquer componente.

### Formulário de Registro

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Se você precisar navegar da página de login para a página de registro, precisará lidar com isso por conta própria no componente de login.

### Formulário de Configurações do Administrador

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

A parte superior mostra a configuração genérica do autenticador, e a parte inferior é a seção do formulário de configuração personalizada que pode ser registrada.

### Requisições de API

Para iniciar requisições de interfaces relacionadas à autenticação de usuário no lado do cliente, você pode usar o SDK fornecido pelo NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// usar em um componente
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Para referências detalhadas da API, consulte [@nocobase/sdk - Auth](/api/sdk/auth).