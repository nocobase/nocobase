---
pkg: '@nocobase/plugin-auth'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Passwort-Authentifizierung

## Konfigurationsoberfläche

![](https://static-docs.nocobase.com/202411131505095.png)

## Registrierung erlauben

Wenn die Registrierung erlaubt ist, wird auf der Anmeldeseite ein Link zum Erstellen eines Kontos angezeigt, über den Sie zur Registrierungsseite gelangen können.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Registrierungsseite

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Wenn die Registrierung nicht erlaubt ist, wird auf der Anmeldeseite kein Link zum Erstellen eines Kontos angezeigt.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Wenn die Registrierung nicht erlaubt ist, kann die Registrierungsseite nicht aufgerufen werden.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Einstellungen für das Registrierungsformular<Badge>v1.4.0-beta.7+</Badge>

Sie können festlegen, welche Felder in der Benutzer-Sammlung im Registrierungsformular angezeigt werden und ob sie Pflichtfelder sind. Mindestens eines der Felder 'Benutzername' oder 'E-Mail' muss als sichtbar und erforderlich festgelegt werden.

![](https://static-docs.nocobase.com/202411262133669.png)

Registrierungsseite

![](https://static-docs.nocobase.com/202411262135801.png)

## Passwort vergessen<Badge>v1.8.0+</Badge>

Die Funktion 'Passwort vergessen' ermöglicht es Benutzern, ihr Passwort per E-Mail-Verifizierung zurückzusetzen, falls sie es vergessen haben.

### Administrator-Konfiguration

1.  **Funktion 'Passwort vergessen' aktivieren**

    Im Reiter "Einstellungen" > "Authentifizierung" > "Passwort vergessen" aktivieren Sie das Kontrollkästchen "Funktion 'Passwort vergessen' aktivieren".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Benachrichtigungskanal konfigurieren**

    Wählen Sie einen E-Mail-Benachrichtigungskanal aus (derzeit wird nur E-Mail unterstützt). Falls kein Benachrichtigungskanal verfügbar ist, müssen Sie zuerst einen hinzufügen.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **E-Mail für die Passwortzurücksetzung konfigurieren**

    Passen Sie den E-Mail-Betreff und -Inhalt an. Es werden HTML- oder Reintextformate unterstützt. Sie können die folgenden Variablen verwenden:
    - Aktueller Benutzer
    - Systemeinstellungen
    - Link zur Passwortzurücksetzung
    - Gültigkeit des Zurücksetzungslinks (Minuten)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Gültigkeit des Zurücksetzungslinks festlegen**

    Legen Sie die Gültigkeitsdauer (in Minuten) für den Zurücksetzungslink fest; Standardwert sind 120 Minuten.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Benutzer-Workflow

1.  **Passwortzurücksetzung anfordern**

    Klicken Sie auf der Anmeldeseite auf den Link "Passwort vergessen" (die Funktion 'Passwort vergessen' muss zuvor vom Administrator aktiviert werden), um zur Seite 'Passwort vergessen' zu gelangen.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Geben Sie die registrierte E-Mail-Adresse ein und klicken Sie auf die Schaltfläche "Zurücksetzungs-E-Mail senden".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Passwort zurücksetzen**

    Der Benutzer erhält eine E-Mail mit einem Zurücksetzungslink. Klicken Sie auf den Link, um eine Seite zu öffnen, auf der Sie ein neues Passwort festlegen können.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Nachdem Sie dies eingerichtet haben, können Sie sich mit dem neuen Passwort im System anmelden.

### Hinweise

-   Der Zurücksetzungslink ist zeitlich begrenzt und standardmäßig 120 Minuten nach seiner Generierung gültig (vom Administrator konfigurierbar).
-   Der Link kann nur einmal verwendet werden und verliert nach Gebrauch sofort seine Gültigkeit.
-   Falls Sie die Zurücksetzungs-E-Mail nicht erhalten haben, überprüfen Sie bitte, ob die E-Mail-Adresse korrekt ist, oder sehen Sie im Spam-Ordner nach.
-   Der Administrator sollte sicherstellen, dass die E-Mail-Server-Konfiguration korrekt ist, um den erfolgreichen Versand der Zurücksetzungs-E-Mail zu gewährleisten.