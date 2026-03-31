---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Configuração da Microsoft

### Pré-requisitos
Para que os usuários possam conectar suas caixas de e-mail do Outlook ao NocoBase, você precisa implantá-lo em um servidor que tenha acesso aos serviços da Microsoft. O backend fará chamadas às APIs da Microsoft.

### Registrar uma Conta

1. Acesse https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
2. Faça login na sua conta Microsoft.

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Criar um Tenant

1. Acesse https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount e faça login na sua conta.
2. Preencha as informações básicas e obtenha o código de verificação.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Preencha as demais informações e continue.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Preencha as informações do seu cartão de crédito (você pode pular esta etapa por enquanto).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Obter o Client ID

1. Clique no menu superior e selecione "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. No lado esquerdo, selecione "App registrations".

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Clique em "New registration" na parte superior.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Preencha as informações e envie.

O nome pode ser qualquer um. Para os tipos de conta, selecione a opção mostrada na imagem abaixo. Você pode deixar o Redirect URI em branco por enquanto.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Obtenha o Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Autorização de API

1. Abra o menu "API permissions" no lado esquerdo.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Clique no botão "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Clique em "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Pesquise e adicione as seguintes permissões. O resultado final deve ser como mostrado na imagem abaixo.
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (Por padrão)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Obter o Segredo

1. No lado esquerdo, clique em "Certificates & secrets".

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Clique no botão "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Preencha a descrição e o tempo de expiração, e clique em Adicionar.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Obtenha o Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Copie o Client ID e o Client secret e cole-os na página de configuração de e-mail.

![](https://static-docs.nocobase.com/mail-1733818630710.png)