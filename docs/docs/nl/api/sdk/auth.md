:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Auth

## Overzicht

De `Auth`-klasse wordt voornamelijk aan de clientzijde gebruikt om toegang te krijgen tot gebruikersinformatie en API's voor gebruikersauthenticatie aan te roepen.

## Instantie-eigenschappen

### `locale`

De taal die de huidige gebruiker gebruikt.

### `role`

De rol die de huidige gebruiker gebruikt.

### `token`

De API `token`.

### `authenticator`

De authenticator die wordt gebruikt voor de authenticatie van de huidige gebruiker. Zie [Gebruikersauthenticatie](/auth-verification/auth/).

## Klassemethoden

### `signIn()`

Gebruiker aanmelden.

#### Signatuur

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parameternaam   | Type     | Beschrijving                                           |
| --------------- | -------- | ------------------------------------------------------ |
| `values`        | `any`    | Aanvraagparameters voor de aanmeld-API                 |
| `authenticator` | `string` | De identificatie van de authenticator die voor het aanmelden wordt gebruikt |

### `signUp()`

Gebruiker registreren.

#### Signatuur

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parameternaam   | Type     | Beschrijving                                           |
| --------------- | -------- | ------------------------------------------------------ |
| `values`        | `any`    | Aanvraagparameters voor de registratie-API             |
| `authenticator` | `string` | De identificatie van de authenticator die voor de registratie wordt gebruikt |

### `signOut()`

Afmelden.

#### Signatuur

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parameternaam   | Type     | Beschrijving                                           |
| --------------- | -------- | ------------------------------------------------------ |
| `values`        | `any`    | Aanvraagparameters voor de afmeld-API                  |
| `authenticator` | `string` | De identificatie van de authenticator die voor het afmelden wordt gebruikt |