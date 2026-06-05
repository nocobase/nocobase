---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação: OIDC

## Introdução

O **plugin** de Autenticação OIDC segue o padrão do protocolo OpenID Connect (OIDC), utilizando o **Fluxo de Código de Autorização**, para permitir que os usuários façam login no NocoBase usando contas fornecidas por provedores de serviço de autenticação de identidade de terceiros (IdP).

## Ativar o plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Adicionar Autenticação OIDC

Acesse a página de gerenciamento do **plugin** de autenticação de usuário.

![](https://static-docs.nocobase.com/202411130004459.png)

Adicionar - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Configuração

### Configuração Básica

![](https://static-docs.nocobase.com/202411130006341.png)

| Configuração                                       | Descrição                                                                                                                                                                | Versão         |
| :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Sign up automatically when the user does not exist | Define se um novo usuário deve ser criado automaticamente caso nenhum usuário existente correspondente seja encontrado.                                                    | -              |
| Issuer                                             | O issuer é fornecido pelo IdP e geralmente termina com `/.well-known/openid-configuration`.                                                                              | -              |
| Client ID                                          | O ID do cliente.                                                                                                                                                         | -              |
| Client Secret                                      | O segredo do cliente.                                                                                                                                                    | -              |
| scope                                              | Opcional, o padrão é `openid email profile`.                                                                                                                             | -              |
| id_token signed response algorithm                 | O algoritmo de assinatura para o `id_token`, o padrão é `RS256`.                                                                                                         | -              |
| Enable RP-initiated logout                         | Habilita o logout iniciado por RP. Desconecta a sessão do IdP quando o usuário faz logout. O callback de logout do IdP deve usar a Post logout redirect URL fornecida em [Uso](#uso). | `v1.3.44-beta` |

### Mapeamento de Campos

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Configuração                    | Descrição                                                                                                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Mapeamento de campos. O NocoBase atualmente suporta o mapeamento de campos como apelido, e-mail e número de telefone. O apelido padrão usa `openid`.            |
| Use this field to bind the user | Usado para corresponder e vincular a usuários existentes. Você pode escolher e-mail ou nome de usuário, sendo o e-mail o padrão. O IdP deve fornecer informações de usuário que incluam os campos `email` ou `username`. |

### Configuração Avançada

![](https://static-docs.nocobase.com/202411130013306.png)

| Configuração                                                      | Descrição                                                                                                                                                                                                                                                         | Versão         |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| HTTP                                                              | Define se a URL de callback do NocoBase usa o protocolo HTTP. O padrão é `https`.                                                                                                                                                                                   | -              |
| Port                                                              | A porta para a URL de callback do NocoBase. O padrão é `443/80`.                                                                                                                                                                                                     | -              |
| State token                                                       | Usado para verificar a origem da requisição e prevenir ataques CSRF. Você pode fornecer um valor fixo, mas **é fortemente recomendado deixar em branco para que valores aleatórios sejam gerados por padrão. Se você usar um valor fixo, avalie cuidadosamente seu ambiente e os riscos de segurança.** | -              |
| Pass parameters in the authorization code grant exchange          | Alguns IdPs podem exigir a passagem do Client ID ou Client Secret como parâmetros ao trocar um código por um token. Você pode selecionar esta opção e especificar os nomes dos parâmetros correspondentes.                                                                | -              |
| Method to call the user info endpoint                             | O método HTTP usado ao solicitar a API de informações do usuário.                                                                                                                                                                                                     | -              |
| Where to put the access token when calling the user info endpoint | Como o token de acesso é passado ao chamar a API de informações do usuário:<br/>- Header - No cabeçalho da requisição (padrão).<br />- Body - No corpo da requisição, usado com o método `POST`.<br />- Query parameters - Como parâmetros de consulta, usado com o método `GET`. | -              |
| Skip SSL verification                                             | Ignora a verificação SSL ao requisitar a API do IdP. **Esta opção expõe seu sistema a riscos de ataques man-in-the-middle. Habilite esta opção apenas se você compreender seu propósito e implicações. É fortemente desencorajado o uso desta configuração em ambientes de produção.** | `v1.3.40-beta` |

### Uso

![](https://static-docs.nocobase.com/202411130019570.png)

| Configuração            | Descrição                                                                                    |
| :---------------------- | :------------------------------------------------------------------------------------------- |
| Redirect URL            | Usado para configurar a URL de callback no IdP.                                              |
| Post logout redirect URL | Usado para configurar a Post logout redirect URL no IdP quando o logout iniciado por RP está habilitado. |

:::info
Ao testar localmente, use `127.0.0.1` em vez de `localhost` para a URL, pois o login OIDC exige a gravação de um estado no cookie do cliente para validação de segurança. Se você notar que a janela de login pisca rapidamente, mas o login não é bem-sucedido, verifique os logs do servidor em busca de problemas de incompatibilidade de estado e certifique-se de que o parâmetro de estado esteja incluído no cookie da requisição. Esse problema geralmente ocorre quando o estado no cookie do cliente não corresponde ao estado na requisição.
:::

## Login

Acesse a página de login e clique no botão abaixo do formulário de login para iniciar o login de terceiros.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)