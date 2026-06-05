:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Google Workspace

## Google als IdP einrichten

[Google Admin-Konsole](https://admin.google.com/) - Apps - Web- und mobile Apps

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Nachdem Sie die App eingerichtet haben, kopieren Sie die **SSO-URL**, die **Entitäts-ID** und das **Zertifikat**.

![](https://static-docs.nocobase.com/aafd30a794730e85411c0c8f368637e0.png)

## Neuen Authentifikator in NocoBase hinzufügen

Plugin-Einstellungen - Benutzerauthentifizierung - Hinzufügen - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Tragen Sie die soeben kopierten Informationen der Reihe nach ein:

- SSO URL: SSO-URL
- Public Certificate: Zertifikat
- idP Issuer: Entitäts-ID
- http: Aktivieren Sie diese Option, wenn Sie lokal mit HTTP testen.

Kopieren Sie anschließend den SP Issuer/EntityID und die ACS-URL aus dem Bereich „Usage“.

## SP-Informationen in Google eintragen

Kehren Sie zur Google-Konsole zurück. Geben Sie auf der Seite **Dienstanbieterdetails** die zuvor kopierte ACS-URL und Entitäts-ID ein und aktivieren Sie die Option **Signierte Antwort**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Fügen Sie unter **Attributzuordnung** Zuordnungen für die entsprechenden Attribute hinzu.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)