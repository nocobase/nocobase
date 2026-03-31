:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Mit Google anmelden

> https://developers.google.com/identity/openid-connect/openid-connect

## Google OAuth 2.0 Anmeldeinformationen erhalten

Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/apis/credentials) und wählen Sie dort "Anmeldeinformationen erstellen" und anschließend "OAuth-Client-ID" aus.

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Navigieren Sie zur Konfigurationsoberfläche und geben Sie die autorisierte Weiterleitungs-URL ein. Die Weiterleitungs-URL erhalten Sie in NocoBase, wenn Sie einen Authentifikator hinzufügen. In der Regel lautet sie `http(s)://host:port/api/oidc:redirect`. Weitere Informationen finden Sie im Abschnitt [Benutzerhandbuch - Konfiguration](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Einen neuen Authentifikator in NocoBase hinzufügen

Gehen Sie zu "Plugin-Einstellungen" - "Benutzerauthentifizierung" - "Hinzufügen" - "OIDC".

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Beziehen Sie sich auf die im [Benutzerhandbuch - Konfiguration](../index.md#configuration) beschriebenen Parameter, um die Konfiguration des Authentifikators abzuschließen.