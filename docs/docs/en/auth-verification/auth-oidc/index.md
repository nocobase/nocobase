---
pkg: '@nocobase/plugin-auth-oidc'
---

# Auth: OIDC

## Introduction

The Auth: OIDC plugin follows the OIDC (Open ConnectID) protocol standard, using the Authorization Code Flow, to allow users to sign in to NocoBase using accounts provided by third-party identity authentication service providers (IdP).

## Activate Plugin


![](https://static-docs.nocobase.com/202411122358790.png)


## Add OIDC Authentication

Enter the user authentication plugin management page.


![](https://static-docs.nocobase.com/202411130004459.png)


Add - OIDC


![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)


## Configuration

### Basic Configuration


![](https://static-docs.nocobase.com/202411130006341.png)


| Configuration                                      | Description                                                                                                                                                                | Version        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | Whether to automatically create a new user if no matching existing user is found.                                                                                          | -              |
| Issuer                                             | The issuer provided by the IdP, usually ending with `/.well-known/openid-configuration`.                                                                                   | -              |
| Client ID                                          | The Client ID                                                                                                                                                              | -              |
| Client Secret                                      | The Client Secret                                                                                                                                                          | -              |
| scope                                              | Optional, defaults to `openid email profile`.                                                                                                                              | -              |
| id_token signed response algorithm                 | The signing algorithm for `id_token`, defaults to `RS256`.                                                                                                                 | -              |
| Enable RP-initiated logout                         | Enables RP-initiated logout. Logs out the IdP session when the user logs out. The IdP logout callback should use the Post logout redirect URL provided in [Usage](#usage). | `v1.3.44-beta` |

### Field Mapping


![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)


| Configuration                   | Description                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Field mapping. NocoBase supports mapping fields such as nickname, email, and phone number. The default nickname uses `openid`.                                   |
| Use this field to bind the user | Used to match and bind with existing users. You can choose email or username, with email as the default. The IdP must provide `email` or `username` information. |

### Advanced Configuration


![](https://static-docs.nocobase.com/202411130013306.png)


| Configuration                                                     | Description                                                                                                                                                                                                                                                         | Version        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP                                                              | Whether the NocoBase callback URL uses HTTP protocol, default is `https`.                                                                                                                                                                                           | -              |
| Port                                                              | Port for the NocoBase callback URL, defaults to `443/80`.                                                                                                                                                                                                           | -              |
| State token                                                       | Used to verify the request source and prevent CSRF attacks. You can provide a fixed value, but **leaving it blank to generate random values by default is strongly recommended. If you use a fixed value, carefully evaluate your environment and security risks.** | -              |
| Pass parameters in the authorization code grant exchange          | Some IdPs may require passing Client ID or Client Secret as parameters when exchanging a code for a token. You can select this option and specify the corresponding parameter names.                                                                                | -              |
| Method to call the user info endpoint                             | The HTTP method used when requesting the user info API.                                                                                                                                                                                                             | -              |
| Where to put the access token when calling the user info endpoint | How the access token is passed when calling the user info API:<br/>- Header - In the request header (default).<br />- Body - In the request body, used with `POST` method.<br />- Query parameters - As query parameters, used with `GET` method.                   | -              |
| Skip SSL verification                                             | Skip SSL verification when requesting the IdP API. **This option exposes your system to risks of man-in-the-middle attacks. Only enable this option if you understand its purpose and implications. It is strongly discouraged in production environments.**        | `v1.3.40-beta` |

### Usage


![](https://static-docs.nocobase.com/202411130019570.png)


| Configuration            | Description                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Redirect URL             | Used to configure the callback URL in the IdP.                                                 |
| Post logout redirect URL | Used to configure the Post logout redirect URL in the IdP when RP-initiated logout is enabled. |

:::info
When testing locally, use `127.0.0.1` instead of `localhost` for the URL, as OIDC login requires writing state to the client cookie for security validation. If you see a flash of the login window but fail to log in successfully, check the server logs for state mismatch issues and ensure the state parameter is included in the request cookie. This issue often occurs when the state in the client cookie does not match the state in the request.
:::

## Login

Visit the login page and click the button below the login form to initiate third-party login.


![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)