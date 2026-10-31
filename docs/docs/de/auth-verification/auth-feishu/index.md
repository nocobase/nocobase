---
pkg: '@nocobase/plugin-feishu'
---

# Authentifizierung: Feishu / Lark

## Einführung

Das **Feishu / Lark** Plugin ermöglicht Benutzern, sich mit ihrem Feishu- oder Lark-Konto bei NocoBase anzumelden, mit optionaler automatischer Anmeldung.

## Plugin aktivieren

Feishu / Lark ist ein kommerzielles Plugin. Installieren und aktivieren Sie es im Plugin-Manager zusammen mit dem Plugin **Benutzerauthentifizierung**.

## App auf der offenen Plattform erstellen

Öffnen Sie die [Feishu Open Platform](https://open.feishu.cn/) und erstellen Sie eine **unternehmensinterne App** (für Lark verwenden Sie die [Lark Open Platform](https://open.larksuite.com/)). Notieren Sie sich **App ID** und **App Secret**.

Für die Anmeldung sind keine zusätzlichen API-Berechtigungen erforderlich. Für die Kontakt-Synchronisierung siehe [Benutzerdaten aus Feishu synchronisieren](/users-permissions/sync/sources/feishu).

## Redirect-URL konfigurieren

Fügen Sie unter **Sicherheitseinstellungen** → **Weiterleitungs-URLs** der App die von NocoBase angezeigte Callback-URL hinzu:

```
https://ihre-domain/api/feishu:redirect
```

Am einfachsten kopieren Sie die **Redirect-URL** von der Konfigurationsseite des Authenticators in NocoBase.

:::warning
Wenn NocoBase unter einem Unterpfad betrieben wird (z. B. `APP_PUBLIC_PATH=/nocobase/`), enthält die Callback-URL den Präfix, z. B. `https://ihre-domain/nocobase/api/feishu:redirect`. Die URL in der Allowlist der offenen Plattform muss exakt mit der tatsächlichen URL übereinstimmen.
:::

## Feishu-Authentifizierung in NocoBase hinzufügen

Öffnen Sie **Benutzerauthentifizierung** und fügen Sie einen **Feishu / Lark** Authenticator hinzu:

| Feld | Beschreibung |
| --- | --- |
| Automatisch registrieren | Erstellt beim ersten Login automatisch ein Konto. Standardmäßig aktiviert. |
| Region | `Feishu China` oder `Lark Global`. |
| App ID / App Secret | Zugangsdaten der Feishu-App. Umgebungsvariablen und Secrets werden unterstützt. |
| Origin | Öffentliche Adresse der Site, z. B. `https://example.com`. Nur Protokoll und Domain, ohne Pfad (abschließender Schrägstrich optional); leer bedeutet aktuelle Request-Adresse. |
| Eindeutiges Benutzerkennzeichen-Feld | Der Identitätsschlüssel des Benutzers, siehe unten. |
| Automatische Anmeldung | Stille Anmeldung beim Öffnen innerhalb von Feishu, siehe unten. |

## Wahl des eindeutigen Benutzerkennzeichen-Felds

| Feld | Beschreibung |
| --- | --- |
| `union_id` | Empfohlen. Stabil und für alle Apps desselben Entwicklerkontos gleich. |
| `open_id` | Pro App eindeutig; ändert sich beim App-Wechsel. |
| `user_id` | Innerhalb eines Mandanten eindeutig; kann in Multi-Mandant-Szenarien kollidieren. |
| `mobile` / `email` | Änderbar und optional leer; als Kennzeichen ungeeignet. |

Halten Sie die Wahl stabil, sobald sich Benutzer angemeldet haben. Bei gebruik von Benutzerdatensynchronisierung wählen Sie im Sync-Quelle dasselbe Feld.

## Anmeldung und automatische Registrierung

Benutzer klicken auf der Anmeldeseite auf **Feishu / Lark** und schließen die OAuth-Anmeldung ab. Mit automatischer Registrierung:

- Benutzer werden anhand des **eindeutigen Kennzeichen-Felds** zugeordnet oder erstellt;
- Telefon, E-Mail und Spitzname werden nur bei leerem Profil ergänzt; bestehende Werte werden nie überschrieben.

## Automatische Anmeldung

Mit **automatischer Anmeldung** startet das Öffnen der App im Feishu-Client die OAuth-Anmeldung ohne Klick auf die Anmelde-Schaltfläche. Nur ein Feishu-Authenticator kann gleichzeitig die automatische Anmeldung nutzen.

Voraussetzungen:

- Die Callback-URL steht in der **Redirect-URL**-Allowlist;
- Die App ist veröffentlicht und der Benutzer liegt im Verfügbarkeitsbereich;
- Die App wird im Feishu-Client geöffnet.

Die erste Nutzung zeigt eine einmalige Bestätigungsseite; danach erfolgt die Anmeldung stille. Im Systembrowser wird keine automatische Anmeldung ausgelöst — das ist erwartetes Verhalten.

## Feishu-Workbench-Einstieg (optional)

Konfigurieren Sie die Desktop-/Mobile-Startseite unter **App-Funktionen** → **Web-App**, damit Benutzer NocoBase direkt aus der Feishu-Workbench öffnen können. Die URL muss der tatsächlichen NocoBase-Adresse entsprechen (einschließlich Unterpfad-Präfix).
