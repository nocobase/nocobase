---
pkg: '@nocobase/plugin-auth'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação por Senha

## Interface de Configuração

![](https://static-docs.nocobase.com/202411131505095.png)

## Permitir Cadastro

Quando o cadastro é permitido, a página de login exibirá o link para criar uma conta, e você poderá acessar a página de cadastro.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Página de cadastro

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Quando o cadastro não é permitido, a página de login não exibirá o link para criar uma conta.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a934745121.png)

Quando o cadastro não é permitido, a página de cadastro não poderá ser acessada.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Configurações do Formulário de Cadastro<Badge>v1.4.0-beta.7+</Badge>

Você pode definir quais campos da **coleção** de usuários devem ser exibidos no formulário de cadastro e se são obrigatórios. Pelo menos um dos campos, nome de usuário ou e-mail, precisa ser configurado para exibição e como obrigatório.

![](https://static-docs.nocobase.com/202411262133669.png)

Página de cadastro

![](https://static-docs.nocobase.com/202411262135801.png)

## Esqueci a Senha<Badge>v1.8.0+</Badge>

A funcionalidade de 'Esqueci a Senha' permite que os usuários redefinam suas senhas por meio de verificação de e-mail, caso a esqueçam.

### Configuração do Administrador

1.  **Ativar a Funcionalidade 'Esqueci a Senha'**

    Na aba "Configurações" > "Autenticação" > "Esqueci a Senha", marque a caixa de seleção "Ativar a Funcionalidade 'Esqueci a Senha'".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Configurar Canal de Notificação**

    Selecione um canal de notificação por e-mail (atualmente, apenas e-mail é suportado). Se não houver um canal de notificação disponível, você precisará adicionar um primeiro.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Configurar E-mail de Redefinição de Senha**

    Personalize o assunto e o conteúdo do e-mail, com suporte a formato HTML ou texto simples. Você pode usar as seguintes variáveis:
    - Usuário atual
    - Configurações do sistema
    - Link para redefinir senha
    - Validade do link de redefinição (minutos)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Definir Validade do Link de Redefinição**

    Defina o período de validade (em minutos) para o link de redefinição; o padrão é 120 minutos.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Fluxo de Uso do Usuário

1.  **Iniciar Solicitação de Redefinição de Senha**

    Na página de login, clique no link "Esqueci a Senha" (o administrador precisa ter ativado a funcionalidade 'Esqueci a Senha' primeiro) para acessar a página de redefinição de senha.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Insira o endereço de e-mail cadastrado e clique no botão "Enviar E-mail de Redefinição".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Redefinir Senha**

    O usuário receberá um e-mail contendo um link de redefinição. Após clicar no link, uma página será aberta para que você possa definir uma nova senha.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Após a configuração, o usuário poderá fazer login no sistema com a nova senha.

### Observações

- O link de redefinição tem um limite de tempo; por padrão, ele é válido por 120 minutos após a geração (configurável pelo administrador).
- O link pode ser usado apenas uma vez e se torna inválido imediatamente após o uso.
- Se o usuário não receber o e-mail de redefinição, verifique se o endereço de e-mail está correto ou confira a pasta de spam.
- O administrador deve garantir que a configuração do servidor de e-mail esteja correta para assegurar que o e-mail de redefinição seja enviado com sucesso.