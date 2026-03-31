---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Configuração do Google

### Pré-requisitos

Para que os usuários consigam conectar suas contas do Google Mail ao NocoBase, é essencial que o sistema esteja implantado em um servidor com acesso aos serviços do Google. Isso porque o backend fará chamadas à API do Google.

### Registrar uma Conta

1. Abra https://console.cloud.google.com/welcome para acessar o Google Cloud.
2. Na sua primeira visita, você precisará concordar com os termos e condições.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Criar um Aplicativo

1. Clique em "Select a project" no topo.

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Clique no botão "NEW PROJECT" na janela pop-up.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Preencha as informações do projeto.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Após a criação do projeto, selecione-o.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Habilitar a API do Gmail

1. Clique no botão "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Acesse o painel de APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Pesquise por "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Clique no botão "ENABLE" para habilitar a API do Gmail.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Configurar a tela de consentimento OAuth

1. Clique no menu "OAuth consent screen" à esquerda.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Selecione "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Preencha as informações do projeto (elas serão exibidas na página de autorização) e clique em salvar.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Preencha as informações de contato do desenvolvedor e clique em continuar.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Clique em continuar.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Adicione usuários de teste para realizar testes antes da publicação do aplicativo.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Clique em continuar.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Revise as informações de resumo e retorne ao painel.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Criar Credenciais

1. Clique no menu "Credentials" à esquerda.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Clique no botão "CREATE CREDENTIALS" e selecione "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Selecione "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Preencha as informações do aplicativo.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Insira o domínio de implantação final do projeto (o exemplo aqui é um endereço de teste do NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Adicione o URI de redirecionamento autorizado. Ele deve ser `domínio + "/admin/settings/mail/oauth2"`. Por exemplo: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Clique em criar para visualizar as informações do OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Copie o Client ID e o Client secret e cole-os na página de configuração de e-mail.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Clique em salvar para concluir a configuração.

### Publicar o Aplicativo

Após concluir o processo acima e testar funcionalidades como o login de autorização para usuários de teste e o envio de e-mails, você poderá publicar o aplicativo.

1. Clique no menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Clique no botão "EDIT APP" e, em seguida, clique no botão "SAVE AND CONTINUE" na parte inferior.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Clique no botão "ADD OR REMOVE SCOPES" para selecionar os escopos de permissão do usuário.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Pesquise por "Gmail API" e, em seguida, marque "Gmail API" (confirme que o valor do Scope é a API do Gmail com "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Clique no botão "UPDATE" na parte inferior para salvar.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Clique no botão "SAVE AND CONTINUE" na parte inferior de cada página e, por fim, clique no botão "BACK TO DASHBOARD" para retornar à página do painel.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Clique no botão "PUBLISH APP". Uma página de confirmação aparecerá, listando as informações necessárias para a publicação. Em seguida, clique no botão "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Retorne à página do console e você verá que o status de publicação é "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Clique no botão "PREPARE FOR VERIFICATION", preencha as informações necessárias e clique no botão "SAVE AND CONTINUE" (os dados na imagem são apenas para fins de demonstração).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Continue preenchendo as informações necessárias (os dados na imagem são apenas para fins de demonstração).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Clique no botão "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Clique no botão "SUBMIT FOR VERIFICATION" para enviar para verificação.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Aguarde o resultado da aprovação.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Caso a aprovação ainda esteja pendente, os usuários podem clicar no link "unsafe" para autorizar e fazer login.

![](https://static-docs.nocobase.com/mail-1735633689645.png)