:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Authentifizierungstypen erweitern

## Überblick

NocoBase ermöglicht es Ihnen, Benutzerauthentifizierungstypen nach Bedarf zu erweitern. Die Benutzerauthentifizierung lässt sich grundsätzlich in zwei Typen unterteilen: Zum einen die Bestimmung der Benutzeridentität innerhalb der NocoBase-Anwendung selbst, wie z. B. die Anmeldung mit Passwort oder SMS. Zum anderen die Bestimmung der Benutzeridentität durch Drittanbieterdienste, die das Ergebnis über Callbacks an die NocoBase-Anwendung übermitteln, wie z. B. OIDC oder SAML. Der Authentifizierungsprozess für diese beiden Typen in NocoBase ist im Wesentlichen wie folgt:

### Ohne Abhängigkeit von Drittanbieter-Callbacks

1. Der Client ruft über das NocoBase SDK die Anmeldeschnittstelle `api.auth.signIn()` auf und fordert die Anmeldeschnittstelle `auth:signIn` an. Dabei wird der Bezeichner des aktuell verwendeten Authentifikators über den Request-Header `X-Authenticator` an das Backend übermittelt.
2. Die `auth:signIn`-Schnittstelle leitet die Anfrage basierend auf dem Authentifikator-Bezeichner im Request-Header an den entsprechenden Authentifizierungstyp weiter. Die `validate`-Methode der für diesen Authentifizierungstyp registrierten Authentifizierungsklasse übernimmt dann die entsprechende logische Verarbeitung.
3. Der Client empfängt Benutzerinformationen und den Authentifizierungs-`token` aus der `auth:signIn`-Schnittstellenantwort, speichert den `token` im Local Storage und schließt die Anmeldung ab. Dieser Schritt wird automatisch intern vom SDK verarbeitet.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Mit Abhängigkeit von Drittanbieter-Callbacks

1. Der Client ruft über eine selbst registrierte Schnittstelle (z. B. `auth:getAuthUrl`) die URL für die Drittanbieter-Anmeldung ab und übermittelt gemäß Protokoll Informationen wie den Anwendungsnamen und den Authentifikator-Bezeichner.
2. Nach der Weiterleitung zur Drittanbieter-URL zur Anmeldung ruft der Drittanbieterdienst die Callback-Schnittstelle der NocoBase-Anwendung (die selbst registriert werden muss, z. B. `auth:redirect`) auf. Er gibt das Authentifizierungsergebnis sowie Informationen wie den Anwendungsnamen und den Authentifikator-Bezeichner zurück.
3. Die Callback-Schnittstellenmethode parst die Parameter, um den Authentifikator-Bezeichner zu erhalten, ruft über den `AuthManager` die entsprechende Authentifizierungsklasse ab und ruft aktiv die Methode `auth.signIn()` auf. Die Methode `auth.signIn()` wiederum ruft die Methode `validate()` auf, um die Authentifizierungslogik zu verarbeiten.
4. Nachdem die Callback-Methode den Authentifizierungs-`token` erhalten hat, leitet sie mit dem Statuscode 302 zurück zur Frontend-Seite weiter und übergibt den `token` sowie den Authentifikator-Bezeichner als URL-Parameter, z. B. `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Im Folgenden wird beschrieben, wie Sie serverseitige Schnittstellen und clientseitige Benutzeroberflächen registrieren.

## Serverseite

### Authentifizierungsschnittstelle

Der NocoBase-Kernel bietet die Registrierung und Verwaltung zur Erweiterung von Authentifizierungstypen. Die Kernlogik für die Erweiterung eines Anmelde-Plugins erfordert die Vererbung von der abstrakten Klasse `Auth` des Kernels und die Implementierung der entsprechenden Standardschnittstellen.  
Eine vollständige API-Referenz finden Sie unter [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Der Kernel registriert auch grundlegende Ressourcenoperationen im Zusammenhang mit der Benutzerauthentifizierung.

| API            | Beschreibung                       |
| -------------- | ---------------------------------- |
| `auth:check`   | Überprüfen, ob Benutzer angemeldet ist |
| `auth:signIn`  | Anmelden                           |
| `auth:signUp`  | Registrieren                       |
| `auth:signOut` | Abmelden                           |

In den meisten Fällen kann der erweiterte Benutzerauthentifizierungstyp auch die bestehende JWT-Authentifizierungslogik nutzen, um Anmeldeinformationen für den API-Zugriff des Benutzers zu generieren. Die `BaseAuth`-Klasse im Kernel bietet eine grundlegende Implementierung der abstrakten Klasse `Auth`. Siehe [BaseAuth](../../../api/auth/base-auth.md). Plugins können direkt von der `BaseAuth`-Klasse erben, um Teile des Logikcodes wiederzuverwenden und so die Entwicklungskosten zu senken.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Benutzer-Sammlung festlegen
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Benutzerauthentifizierungslogik implementieren
  async validate() {}
}
```

### Benutzerdaten

Bei der Implementierung der Benutzerauthentifizierungslogik ist in der Regel die Verarbeitung von Benutzerdaten involviert. In einer NocoBase-Anwendung sind die zugehörigen Sammlungen standardmäßig wie folgt definiert:

| Daten-Sammlung        | Beschreibung                                                                                             | Plugin                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `users`               | Speichert Benutzerinformationen wie E-Mail, Spitzname und Passwort                                       | [Benutzer-Plugin (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Speichert Authentifikator-Informationen (Authentifizierungstyp-Entität), entsprechend dem Authentifizierungstyp und der Konfiguration | Benutzerauthentifizierungs-Plugin (`@nocobase/plugin-auth`)         |
| `usersAuthenticators` | Verknüpft Benutzer und Authentifikatoren, speichert Benutzerinformationen unter dem entsprechenden Authentifikator | Benutzerauthentifizierungs-Plugin (`@nocobase/plugin-auth`)         |

Im Allgemeinen können erweiterte Anmeldemethoden die Sammlungen `users` und `usersAuthenticators` verwenden, um die entsprechenden Benutzerdaten zu speichern. Nur in speziellen Fällen ist es notwendig, eine neue Sammlung hinzuzufügen.

Die Hauptfelder von `usersAuthenticators` sind:

| Feld            | Beschreibung                                                                       |
| --------------- | ---------------------------------------------------------------------------------- |
| `uuid`          | Eindeutiger Benutzerbezeichner für diese Authentifizierungsmethode, z. B. Telefonnummer oder WeChat OpenID |
| `meta`          | JSON-Feld für weitere zu speichernde Informationen                                 |
| `userId`        | Benutzer-ID                                                                        |
| `authenticator` | Name des Authentifikators (eindeutiger Bezeichner)                                 |

Für Benutzerabfragen und -erstellungen kapselt das Datenmodell `AuthModel` der `authenticators` ebenfalls mehrere Methoden, die in der `CustomAuth`-Klasse über `this.authenticator[Methodenname]` verwendet werden können. Eine vollständige API-Referenz finden Sie unter [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Benutzer abfragen
    this.authenticator.newUser(); // Neuen Benutzer erstellen
    this.authenticator.findOrCreateUser(); // Benutzer abfragen oder erstellen
    // ...
  }
}
```

### Registrierung des Authentifizierungstyps

Die erweiterte Authentifizierungsmethode muss beim Authentifizierungsverwaltungsmodul registriert werden.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Clientseite

Die clientseitige Benutzeroberfläche wird über die vom Client des Benutzerauthentifizierungs-Plugins bereitgestellte Schnittstelle `registerType` registriert:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Anmeldeformular
        SignInButton, // Anmelde-Button (Drittanbieter), kann alternativ zum Anmeldeformular verwendet werden
        SignUpForm, // Registrierungsformular
        AdminSettingsForm, // Admin-Einstellungen-Formular
      },
    });
  }
}
```

### Anmeldeformular

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Wenn mehrere Authentifikatoren, die einem Authentifizierungstyp entsprechen, Anmeldeformulare registriert haben, werden diese in Form von Tabs angezeigt. Der Tab-Titel entspricht dem im Backend konfigurierten Titel des Authentifikators.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Anmelde-Button

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Dies ist in der Regel ein Anmelde-Button für Drittanbieter, kann aber tatsächlich jede beliebige Komponente sein.

### Registrierungsformular

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Wenn Sie von der Anmeldeseite zur Registrierungsseite wechseln möchten, müssen Sie dies selbst in der Anmeldekomponente implementieren.

### Admin-Einstellungen-Formular

![](https://static-docs.nocobase.com/f4b544b5b0f4f4ee5621ad4abf66b24f.png)

Oben sehen Sie die allgemeine Authentifikator-Konfiguration, unten den Teil des benutzerdefinierten Konfigurationsformulars, der registriert werden kann.

### API-Anfragen

Um clientseitig Anfragen an Schnittstellen zur Benutzerauthentifizierung zu stellen, können Sie das von NocoBase bereitgestellte SDK verwenden.

```ts
import { useAPIClient } from '@nocobase/client';

// In einer Komponente verwenden
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Eine detaillierte API-Referenz finden Sie unter [@nocobase/sdk - Auth](/api/sdk/auth).