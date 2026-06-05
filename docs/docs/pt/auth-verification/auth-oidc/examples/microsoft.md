:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Adicionando um Autenticador no NocoBase

Primeiro, adicione um novo autenticador no NocoBase: Configurações do Plugin - Autenticação de Usuário - Adicionar - OIDC.

Copie a URL de callback.

![](https://static-docs.nocobase.com/202412021504114.png)

## Registre o aplicativo

Abra o centro de administração do Microsoft Entra e registre um novo aplicativo.

![](https://static-docs.nocobase.com/202412021506837.png)

Cole aqui a URL de callback que você acabou de copiar.

![](https://static-docs.nocobase.com/202412021520696.png)

## Obtenha e preencha as informações necessárias

Clique no aplicativo que você acabou de registrar e copie o **Application (client) ID** e o **Directory (tenant) ID** da página de visão geral.

![](https://static-docs.nocobase.com/202412021522063.png)

Clique em `Certificates & secrets`, crie um novo segredo do cliente (Client secrets) e copie o **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

A correspondência entre as informações do Microsoft Entra e a configuração do autenticador do NocoBase é a seguinte:

| Informações do Microsoft Entra | Campo do Autenticador NocoBase                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID        | Client ID                                                                                                                                        |
| Client secrets - Value         | Client secret                                                                                                                                    |
| Directory (tenant) ID          | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, substitua `{tenant}` pelo Directory (tenant) ID |