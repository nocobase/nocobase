# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Add an Authenticator in NocoBase

First, add a new authenticator in NocoBase: Plugin Settings - User Authentication - Add - OIDC.

Copy the callback URL.


![](https://static-docs.nocobase.com/202412021504114.png)


## Register an Application

Open the Microsoft Entra admin center and register a new application.


![](https://static-docs.nocobase.com/202412021506837.png)


Enter the callback URL you just copied here.


![](https://static-docs.nocobase.com/202412021520696.png)


## Get and Fill in the Corresponding Information

Click to enter the application you just registered, and copy the **Application (client) ID** and **Directory (tenant) ID** from the homepage.


![](https://static-docs.nocobase.com/202412021522063.png)


Click Certificates & secrets, create a new client secret, and copy the **Value**.


![](https://static-docs.nocobase.com/202412021522846.png)


The mapping between the above information and the NocoBase authenticator configuration is as follows:

| Microsoft Entra Information | NocoBase Authenticator Configuration                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, where `{tenant}` needs to be replaced with the corresponding Directory (tenant) ID |