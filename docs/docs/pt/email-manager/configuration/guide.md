---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Processo de Configuração

## Visão Geral
Depois de ativar o **plugin** de e-mail, os administradores precisam primeiro configurar tudo para que os usuários possam conectar suas contas de e-mail ao NocoBase. (No momento, só é possível fazer login com autorização para contas Outlook e Gmail; o login direto com contas Microsoft e Google ainda não é suportado).

O ponto principal da configuração está nas definições de autenticação para as chamadas de API do provedor de serviços de e-mail. Os administradores precisam seguir os passos abaixo para garantir que o **plugin** funcione corretamente:

1.  **Obter informações de autenticação do provedor de serviços**
    -   Faça login no console do desenvolvedor do provedor de serviços de e-mail (por exemplo, Google Cloud Console ou Microsoft Azure Portal).
    -   Crie um novo aplicativo ou projeto e ative o serviço de API de e-mail do Gmail ou Outlook.
    -   Obtenha o Client ID e o Client Secret correspondentes.
    -   Configure o URI de Redirecionamento (Redirect URI) para que corresponda ao endereço de callback do **plugin** do NocoBase.

2.  **Configuração do Provedor de Serviços de E-mail**
    -   Acesse a página de configuração do **plugin** de e-mail.
    -   Forneça as informações de autenticação de API necessárias, incluindo o Client ID e o Client Secret, para garantir a autorização adequada com o provedor de serviços de e-mail.

3.  **Login de Autorização**
    -   Os usuários fazem login em suas contas de e-mail usando o protocolo OAuth.
    -   O **plugin** irá gerar e armazenar automaticamente o token de autorização do usuário, que será usado para chamadas de API e operações de e-mail futuras.

4.  **Conectando Contas de E-mail**
    -   Após a autorização bem-sucedida, a conta de e-mail do usuário será conectada ao NocoBase.
    -   O **plugin** irá sincronizar os dados de e-mail do usuário e oferecer recursos para gerenciar, enviar e receber e-mails.

5.  **Utilizando os Recursos de E-mail**
    -   Os usuários podem visualizar, gerenciar e enviar e-mails diretamente na plataforma.
    -   Todas as operações são realizadas através de chamadas de API do provedor de serviços de e-mail, garantindo sincronização em tempo real e transmissão eficiente.

Com o processo descrito acima, o **plugin** de e-mail do NocoBase oferece aos usuários serviços de gerenciamento de e-mail eficientes e seguros. Se você encontrar algum problema durante a configuração, consulte a documentação relevante ou entre em contato com a equipe de suporte técnico para obter ajuda.

## Configuração do Plugin

### Ativar o Plugin de E-mail

1.  Vá para a página de gerenciamento de **plugins**.
2.  Encontre o **plugin** "Email manager" e ative-o.

### Configuração do Provedor de Serviços de E-mail

Depois de ativar o **plugin** de e-mail, você pode configurar os provedores de serviços de e-mail. Atualmente, os serviços de e-mail do Google e da Microsoft são suportados. Clique em "Configurações" -> "Configurações de E-mail" na barra superior para acessar a página de configurações.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Para cada provedor de serviços, você precisará preencher o Client ID e o Client Secret. As seções a seguir detalharão como obter esses dois parâmetros.