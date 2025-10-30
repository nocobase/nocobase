# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Adding an Authenticator in NocoBase

First, add a new authenticator to NocoBase: Plug-in Settings - User authentication - Add - OIDC.

Copy the callback URL.

![](https://static-docs.nocobase.com/202412021504114.png)

## Register the app

Open the Microsoft Entra administration Center and register a new application.

![](https://static-docs.nocobase.com/202412021506837.png)

Fill in the callback URL you just copied here.

![](https://static-docs.nocobase.com/202412021520696.png)

## Obtain and fill in the appropriate information

Click on the Application you just registered and copy the **Application (client) ID** and **Directory (tenant) ID** on the home page.

![](https://static-docs.nocobase.com/202412021522063.png)

Click Certificates & secrets to create a new Client secret and copy the **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

The mapping between the preceding information and the NocoBase authenticator configuration is as follows:

| Microsoft Entra Information | NocoBase Authenticator Field                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Application (client) ID     | Client ID                                                                                                                                       |
| Client Secrets - Value      | Client Secret                                                                                                                                   |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, replace `{tenant}` with the Directory(tenant) ID |
