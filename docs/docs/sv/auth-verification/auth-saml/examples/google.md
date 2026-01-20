:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Google Workspace

## Ställ in Google som IdP

[Googles administratörskonsol](https://admin.google.com/) - Appar - Webbtjänster och mobilappar

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

När du har konfigurerat appen kopierar du **SSO-URL:en**, **entitets-ID:t** och **certifikatet**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Lägg till en ny autentiserare i NocoBase

Inställningar för plugin - Användarautentisering - Lägg till - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Fyll i den information du just kopierade, i följande fält:

- SSO URL: SSO-URL
- Public Certificate: Certifikat
- IdP Issuer: Entitets-ID
- http: Markera om du testar lokalt med http

Kopiera sedan SP Issuer/EntityID och ACS URL från avsnittet "Usage".

## Fyll i SP-information i Google

Gå tillbaka till Googles konsol. På sidan **Information om tjänsteleverantör** anger du den ACS-URL och det entitets-ID du kopierade tidigare, och markerar **Signerat svar**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc4834317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Under **Attributmappning** lägger du till mappningar för de motsvarande attributen.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)