:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Hinzufügen eines Authentifikators in NocoBase

Fügen Sie zunächst in NocoBase einen neuen Authentifikator hinzu: Plugin-Einstellungen - Benutzerauthentifizierung - Hinzufügen - OIDC.

Kopieren Sie die Callback-URL.

![](https://static-docs.nocobase.com/202412021504114.png)

## Registrieren der Anwendung

Öffnen Sie das Microsoft Entra Admin Center und registrieren Sie eine neue Anwendung.

![](https://static-docs.nocobase.com/202412021506837.png)

Fügen Sie hier die soeben kopierte Callback-URL ein.

![](https://static-docs.nocobase.com/202412021520696.png)

## Abrufen und Eintragen der entsprechenden Informationen

Klicken Sie auf die soeben registrierte Anwendung und kopieren Sie auf der Übersichtsseite die **Application (client) ID** und die **Directory (tenant) ID**.

![](https://static-docs.nocobase.com/202412021522063.png)

Klicken Sie auf `Certificates & secrets`, erstellen Sie ein neues Client-Geheimnis (Client secret) und kopieren Sie den **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Die Zuordnung zwischen den Microsoft Entra Informationen und dem NocoBase Authentifikator-Feld ist wie folgt:

| Microsoft Entra Information | NocoBase Authentifikator-Feld                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, ersetzen Sie `{tenant}` durch die entsprechende Directory (tenant) ID |