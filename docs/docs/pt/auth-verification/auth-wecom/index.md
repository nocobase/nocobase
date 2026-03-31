---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação: WeCom

## Introdução

O **plugin WeCom** permite que os usuários façam login no NocoBase usando suas contas WeCom.

## Ativar Plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Criar e Configurar um Aplicativo Personalizado WeCom

Acesse o painel de administração do WeCom para criar um aplicativo personalizado.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Clique no aplicativo para acessar sua página de detalhes, role a página para baixo e clique em "Login Autorizado WeCom".

![](https://static-docs.nocobase.com/202406272104655.png)

Defina o domínio de callback autorizado para o domínio do seu aplicativo NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Volte para a página de detalhes do aplicativo e clique em "Autorização Web e JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Defina e verifique o domínio de callback para o recurso de autorização web OAuth2.0 do aplicativo.

![](https://static-docs.nocobase.com/202406272107899.png)

Na página de detalhes do aplicativo, clique em "IP Confiável da Empresa".

![](https://static-docs.nocobase.com/202406272108834.png)

Configure o IP do aplicativo NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Obter Credenciais no Painel de Administração do WeCom

No painel de administração do WeCom, em "Minha Empresa", copie o "ID da Empresa".

![](https://static-docs.nocobase.com/202406272111637.png)

No painel de administração do WeCom, em "Gerenciamento de Aplicativos", acesse a página de detalhes do aplicativo criado na etapa anterior e copie o AgentId e o Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Adicionar Autenticação WeCom no NocoBase

Acesse a página de gerenciamento de plugins de autenticação de usuário.

![](https://static-docs.nocobase.com/202406272115044.png)

Adicionar - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Configuração

![](https://static-docs.nocobase.com/202412041459250.png)

| Opção                                                                                                 | Descrição                                                                                                                                                                                     | Requisito de Versão |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | Quando um número de telefone não corresponder a um usuário existente, um novo usuário deve ser criado automaticamente?                                                                        | -                   |
| Company ID                                                                                            | ID da Empresa, obtido no painel de administração do WeCom.                                                                                                                                    | -                   |
| AgentId                                                                                               | Obtido na configuração do aplicativo personalizado no painel de administração do WeCom.                                                                                                       | -                   |
| Secret                                                                                                | Obtido na configuração do aplicativo personalizado no painel de administração do WeCom.                                                                                                       | -                   |
| Origin                                                                                                | O domínio do aplicativo atual.                                                                                                                                                                | -                   |
| Link de redirecionamento do aplicativo de área de trabalho                                            | O caminho do aplicativo para redirecionar após um login bem-sucedido.                                                                                                                         | `v1.4.0`            |
| Login automático                                                                                      | Fazer login automaticamente quando o link do aplicativo for aberto no navegador WeCom. Quando vários autenticadores WeCom são configurados, apenas um pode ter esta opção ativada.             | `v1.4.0`            |
| Link da página inicial do aplicativo de área de trabalho                                              | Link da página inicial do aplicativo de área de trabalho.                                                                                                                                     | -                   |

## Configurar a Página Inicial do Aplicativo WeCom

:::info
Para versões `v1.4.0` e superiores, quando a opção "Login automático" está ativada, o link da página inicial do aplicativo pode ser simplificado para: `https://<url>/<path>`, por exemplo, `https://example.nocobase.com/admin`.

Você também pode configurar links separados para dispositivos móveis e desktop, por exemplo, `https://example.nocobase.com/m` e `https://example.nocobase.com/admin`.
:::

Acesse o painel de administração do WeCom e cole o link da página inicial do aplicativo de área de trabalho copiado no campo de endereço da página inicial do aplicativo correspondente.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Login

Acesse a página de login e clique no botão abaixo do formulário de login para iniciar o login de terceiros.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Devido às restrições de permissão do WeCom sobre informações sensíveis, como números de telefone, a autorização só pode ser concluída dentro do cliente WeCom. Ao fazer login com o WeCom pela primeira vez, siga os passos abaixo para concluir a autorização de login inicial dentro do cliente WeCom.
:::

## Primeiro Login

No cliente WeCom, acesse a Área de Trabalho, role até o final e clique no aplicativo para acessar a página inicial que você configurou anteriormente. Isso concluirá a autorização inicial. Depois disso, você poderá usar o WeCom para fazer login no seu aplicativo NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />