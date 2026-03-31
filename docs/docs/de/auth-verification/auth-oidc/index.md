---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Authentifizierung: OIDC

## Einführung

Das Authentifizierung: OIDC Plugin folgt dem OIDC (Open ConnectID) Protokollstandard. Es nutzt den Autorisierungscode-Fluss (Authorization Code Flow), um Benutzern die Anmeldung bei NocoBase über Konten von Drittanbieter-Identitätsanbietern (IdP) zu ermöglichen.

## Plugin aktivieren

![](https://static-docs.nocobase.com/202411122358790.png)

## OIDC-Authentifizierung hinzufügen

Navigieren Sie zur Verwaltungsseite für Benutzerauthentifizierungs-Plugins.

![](https://static-docs.nocobase.com/202411130004459.png)

Hinzufügen - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Konfiguration

### Basiskonfiguration

![](https://static-docs.nocobase.com/202411130006341.png)

| Konfiguration                                      | Beschreibung                                                                                                                                                                | Version        |
| :------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Automatische Registrierung, wenn der Benutzer nicht existiert | Legt fest, ob automatisch ein neuer Benutzer erstellt werden soll, wenn kein passender, bestehender Benutzer gefunden wird.                                           | -              |
| Issuer                                             | Der Issuer wird vom IdP bereitgestellt und endet normalerweise mit `/.well-known/openid-configuration`.                                                                    | -              |
| Client ID                                          | Die Client ID.                                                                                                                                                              | -              |
| Client Secret                                      | Der Client Secret.                                                                                                                                                          | -              |
| scope                                              | Optional, Standardwert ist `openid email profile`.                                                                                                                          | -              |
| id_token signed response algorithm                 | Der Signaturalgorithmus für das `id_token`, Standardwert ist `RS256`.                                                                                                       | -              |
| RP-initiierte Abmeldung aktivieren                 | Aktiviert die RP-initiierte Abmeldung. Meldet die IdP-Sitzung ab, wenn sich der Benutzer abmeldet. Für den IdP-Abmelde-Callback verwenden Sie die unter [Nutzung](#nutzung) angegebene Post-Logout-Weiterleitungs-URL. | `v1.3.44-beta` |

### Feldzuordnung

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Konfiguration                   | Beschreibung                                                                                                                                                      |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feldzuordnung                   | Feldzuordnung. NocoBase unterstützt derzeit die Zuordnung von Feldern wie Spitzname, E-Mail und Telefonnummer. Der Standard-Spitzname verwendet `openid`.         |
| Dieses Feld zur Benutzerbindung verwenden | Dieses Feld wird verwendet, um den Benutzer mit bestehenden Benutzern abzugleichen und zu binden. Sie können E-Mail oder Benutzername wählen, wobei E-Mail der Standardwert ist. Die vom IdP bereitgestellten Benutzerinformationen müssen die Felder `email` oder `username` enthalten. |

### Erweiterte Konfiguration

![](https://static-docs.nocobase.com/202411130013306.png)

| Konfiguration                                                     | Beschreibung                                                                                                                                                                                                                                                         | Version        |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| HTTP                                                              | Gibt an, ob die NocoBase-Callback-URL das HTTP-Protokoll verwendet. Standard ist `https`.                                                                                                                                                                            | -              |
| Port                                                              | Der Port für die NocoBase-Callback-URL. Standard ist `443/80`.                                                                                                                                                                                                       | -              |
| State-Token                                                       | Dient zur Überprüfung der Anforderungsquelle und zur Verhinderung von CSRF-Angriffen. Sie können einen festen Wert eingeben, aber **es wird dringend empfohlen, dieses Feld leer zu lassen, damit standardmäßig Zufallswerte generiert werden. Wenn Sie einen festen Wert verwenden möchten, bewerten Sie bitte Ihre Umgebung und die damit verbundenen Sicherheitsrisiken sorgfältig.** | -              |
| Parameter im Autorisierungscode-Grant-Austausch übergeben         | Einige IdPs verlangen möglicherweise die Übergabe von Client ID oder Client Secret als Parameter beim Austausch eines Codes gegen ein Token. Sie können diese Option aktivieren und die entsprechenden Parameternamen angeben.                                             | -              |
| Methode zum Aufruf des User-Info-Endpunkts                        | Die HTTP-Methode, die beim Anfordern der Benutzerinformations-API verwendet wird.                                                                                                                                                                                     | -              |
| Wo das Access Token beim Aufruf des User-Info-Endpunkts platziert werden soll | Die Art und Weise, wie das Access Token beim Aufruf der Benutzerinformations-API übergeben wird:<br/>- Header – Im Anfrage-Header (Standard).<br />- Body – Im Anfrage-Body, wird mit der `POST`-Methode verwendet.<br />- Query-Parameter – Als Query-Parameter, wird mit der `GET`-Methode verwendet. | -              |
| SSL-Verifizierung überspringen                                    | Überspringt die SSL-Verifizierung beim Anfordern der IdP-API. **Diese Option setzt Ihr System dem Risiko von Man-in-the-Middle-Angriffen aus. Aktivieren Sie diese Option nur, wenn Sie deren Zweck und Implikationen vollständig verstehen. In Produktionsumgebungen wird diese Einstellung dringend abgeraten.** | `v1.3.40-beta` |

### Nutzung

![](https://static-docs.nocobase.com/202411130019570.png)

| Konfiguration            | Beschreibung                                                                                    |
| :----------------------- | :---------------------------------------------------------------------------------------------- |
| Redirect URL             | Wird zur Konfiguration der Callback-URL im IdP verwendet.                                       |
| Post-Logout-Weiterleitungs-URL | Wird zur Konfiguration der Post-Logout-Weiterleitungs-URL im IdP verwendet, wenn die RP-initiierte Abmeldung aktiviert ist. |

:::info
Wenn Sie lokal testen, verwenden Sie bitte `127.0.0.1` anstelle von `localhost` für die URL. Die OIDC-Anmeldemethode erfordert das Schreiben eines State-Wertes in das Client-Cookie zur Sicherheitsvalidierung. Wenn das Anmeldefenster kurz aufblitzt, die Anmeldung aber nicht erfolgreich ist, überprüfen Sie bitte die Server-Logs auf State-Mismatch-Probleme und stellen Sie sicher, dass der State-Parameter im Anfrage-Cookie enthalten ist. Dieses Problem tritt häufig auf, wenn der State im Client-Cookie nicht mit dem in der Anfrage übermittelten State übereinstimmt.
:::

## Anmeldung

Besuchen Sie die Anmeldeseite und klicken Sie auf die Schaltfläche unterhalb des Anmeldeformulars, um die Drittanbieter-Anmeldung zu starten.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)