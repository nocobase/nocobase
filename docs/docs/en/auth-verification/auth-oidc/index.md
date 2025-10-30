# Authentication: OIDC

<PluginInfo commercial="true" name="auth-oidc"></PluginInfo>

## Introduction

The Authentication: OIDC plugin follows the OIDC (OpenID Connect) protocol standard and uses the Authorization Code Flow to enable users to log in to NocoBase using accounts from third-party Identity Providers (IdP).

## Activate Plugin


![](https://static-docs.nocobase.com/202411122358790.png)


## Add OIDC Authentication

Go to the User Authentication plugin management page.


![](https://static-docs.nocobase.com/202411130004459.png)


Add - OIDC


![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)


## Configuration

### Basic Configuration


![](https://static-docs.nocobase.com/202411130006341.png)


| Configuration | Description | Version |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | Automatically create a new user when no existing user can be matched for binding. | - |
| Issuer | The issuer is provided by the IdP, usually ending with `/.well-known/openid-configuration`. | - |
| Client ID | Client ID | - |
| Client Secret | Client Secret | - |
| scope | Optional, defaults to `openid email profile`. | - |
| id_token signed response algorithm | The signing method for the id_token, defaults to `RS256`. | - |
| Enable RP-initiated logout | Enable RP-initiated logout. When a user logs out, their IdP login session will also be terminated. For the IdP logout callback, use the Post logout redirect URL provided in the [Usage](#usage) section. | `v1.3.44-beta` |

### Field Mapping


![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)


| Configuration | Description |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Field Map | Field mapping. The fields available for mapping on the NocoBase side are Nickname, Email, and Phone. By default, `openid` is used for the nickname. |
| Use this field to bind the user | The field used to match and bind with an existing user. You can choose Email or Username, with Email as the default. The user information from the IdP must include an `email` or `username` field. |

### Advanced Configuration


![](https://static-docs.nocobase.com/202411130013306.png)


| Configuration | Description | Version |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP | Whether the NocoBase callback URL uses the http protocol. Defaults to `https`. | - |
| Port | The port for the NocoBase callback URL. Defaults to `443/80`. | - |
| State token | Used to verify the request source and prevent CSRF attacks. You can enter a fixed value, but **it is strongly recommended to leave it blank, as a random value will be generated by default. If you must use a fixed value, please assess your environment and security risks yourself.** | - |
| Pass parameters in the authorization code grant exchange | When exchanging the code for a token, some IdPs may require passing the Client ID or Client Secret as parameters. You can check this option and fill in the corresponding parameter names. | - |
| Method to call the user info endpoint | The HTTP method to use when calling the API to get user information. | - |
| Where to put the access token when calling the user info endpoint | The method for passing the access token when calling the API to get user information.<br/>- Header - In the request header, default.<br />- Body - In the request body, used with the `POST` method.<br />- Query parameters - In the request parameters, used with the `GET` method. | - |
| Skip SSL verification | Skip SSL verification when requesting the IdP API. **This option will expose your system to the risk of man-in-the-middle attacks. Only check this if you fully understand its purpose. It is strongly not recommended to use this setting in a production environment.** | `v1.3.40-beta` |

### Usage


![](https://static-docs.nocobase.com/202411130019570.png)


| Configuration | Description |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Redirect URL | Used to fill in the callback URL configuration in the IdP. |
| Post logout redirect URL | When RP-initiated logout is enabled, this is used to fill in the Post logout redirect URL configuration in the IdP. |

:::info
When testing locally, please use `127.0.0.1` instead of `localhost` for the URL, because the OIDC login method needs to write a state to the client's cookie for security verification. If the login window flashes and disappears without a successful login, check the server logs for state mismatch errors and verify if the request cookie contains the state parameter. This situation is usually caused by a mismatch between the state in the client's cookie and the state carried in the request.
:::

## Login

Visit the login page and click the button below the login form to initiate a third-party login.


![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)