:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Google Workspace

## Google instellen als IdP

[Google Beheerconsole](https://admin.google.com/) - Apps - Web- en mobiele apps

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Nadat u de app heeft ingesteld, kopieert u de **SSO-URL**, de **Entiteits-ID** en het **Certificaat**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Een nieuwe authenticatieprovider toevoegen in NocoBase

**Plugin**-instellingen - Gebruikersauthenticatie - Toevoegen - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Vul de zojuist gekopieerde informatie als volgt in:

- SSO URL: SSO-URL
- Public Certificate: Certificaat
- IdP Issuer: Entiteits-ID
- HTTP: Vink aan als u lokaal test via HTTP

Kopieer vervolgens de SP Issuer/Entiteits-ID en de ACS URL uit het gedeelte 'Usage'.

## SP-informatie invullen in Google

Ga terug naar de Google Console en voer op de pagina **Service Provider Details** de zojuist gekopieerde ACS URL en Entiteits-ID in. Vink ook **Signed Response** aan.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc7234317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Onder **Attribuuttoewijzing** voegt u toewijzingen toe voor de corresponderende attributen.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)