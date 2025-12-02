---
pkg: '@nocobase/plugin-password-policy'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Passwortrichtlinie

## Einführung

Legen Sie für alle Benutzer Passwortregeln, die Gültigkeitsdauer von Passwörtern und Sicherheitsrichtlinien für die Passwortanmeldung fest und verwalten Sie gesperrte Benutzer.

## Passwortregeln

![](https://static-docs.nocobase.com/202412281329313.png)

### Minimale Passwortlänge

Legen Sie die minimale Länge fest, die ein Passwort haben muss. Die maximale Länge beträgt 64 Zeichen.

### Anforderungen an die Passwortkomplexität

Die folgenden Optionen werden unterstützt:

- Muss Buchstaben und Zahlen enthalten
- Muss Buchstaben, Zahlen und Symbole enthalten
- Muss Zahlen, Groß- und Kleinbuchstaben enthalten
- Muss Zahlen, Groß- und Kleinbuchstaben sowie Symbole enthalten
- Muss mindestens 3 der folgenden Zeichenarten enthalten: Zahlen, Großbuchstaben, Kleinbuchstaben und Sonderzeichen
- Keine Einschränkung

![](https://static-docs.nocobase.com/202412281331649.png)

### Passwort darf keinen Benutzernamen enthalten

Legen Sie fest, ob das Passwort den Benutzernamen des aktuellen Benutzers enthalten darf.

### Anzahl der Passworthistorie

Speichern Sie die Anzahl der zuletzt vom Benutzer verwendeten Passwörter. Benutzer können diese Passwörter beim Ändern ihres Passworts nicht erneut verwenden. 0 bedeutet keine Einschränkung, die maximale Anzahl beträgt 24.

## Konfiguration des Passwortablaufs

![](https://static-docs.nocobase.com/202412281335588.png)

### Gültigkeitsdauer des Passworts

Die Gültigkeitsdauer des Benutzerpassworts. Benutzer müssen ihr Passwort vor Ablauf ändern, damit die Gültigkeitsdauer neu berechnet wird. Wenn das Passwort nicht vor Ablauf geändert wird, kann sich der Benutzer nicht mehr mit dem alten Passwort anmelden und benötigt die Unterstützung eines Administrators für eine Zurücksetzung. Sind andere Anmeldemethoden konfiguriert, kann sich der Benutzer weiterhin über diese anmelden.

### Benachrichtigungskanal für den Passwortablauf

Innerhalb von 10 Tagen vor Ablauf des Benutzerpassworts wird bei jeder Anmeldung eine Erinnerung gesendet. Standardmäßig wird die Erinnerung über den internen Nachrichtenkanal „Passwortablauf-Erinnerung“ versendet, der in der Benachrichtigungsverwaltung konfiguriert werden kann.

### Konfigurationsempfehlungen

Da der Ablauf eines Passworts dazu führen kann, dass Konten, einschließlich Administratorkonten, nicht mehr zugänglich sind, wird empfohlen, Passwörter rechtzeitig zu ändern und im System mehrere Konten einzurichten, die berechtigt sind, Benutzerpasswörter zu ändern.

## Passwort-Anmeldesicherheit

Legen Sie Grenzwerte für ungültige Passwort-Anmeldeversuche fest.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maximale Anzahl ungültiger Passwort-Anmeldeversuche

Legen Sie die maximale Anzahl von Anmeldeversuchen fest, die ein Benutzer innerhalb eines bestimmten Zeitintervalls unternehmen darf.

### Maximales Zeitintervall für ungültige Passwort-Anmeldungen (Sekunden)

Legen Sie das Zeitintervall (in Sekunden) fest, innerhalb dessen die maximale Anzahl ungültiger Anmeldeversuche eines Benutzers berechnet wird.

### Sperrdauer (Sekunden)

Legen Sie die Dauer fest, für die ein Benutzer gesperrt wird, nachdem die Grenze für ungültige Passwort-Anmeldeversuche überschritten wurde (0 bedeutet keine Einschränkung). Während der Sperrfrist ist dem Benutzer der Zugriff auf das System über jegliche Authentifizierungsmethode, einschließlich API-Schlüssel, untersagt. Wenn eine manuelle Entsperrung erforderlich ist, lesen Sie bitte [Benutzersperrung](./lockout.md).

### Szenarien

#### Keine Einschränkungen

Es gibt keine Einschränkungen für die Anzahl ungültiger Passwortversuche durch Benutzer.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Häufigkeit der Versuche begrenzen, Benutzer nicht sperren

Beispiel: Ein Benutzer kann sich alle 5 Minuten maximal 5 Mal anmelden.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Benutzer nach Überschreiten des Limits sperren

Beispiel: Wenn ein Benutzer innerhalb von 5 Minuten 5 aufeinanderfolgende ungültige Passwort-Anmeldeversuche unternimmt, wird der Benutzer für 2 Stunden gesperrt.

![](https://static-docs.nocobase.com/202412281344952.png)

### Konfigurationsempfehlungen

- Die Konfiguration der Anzahl ungültiger Passwort-Anmeldeversuche und des Zeitintervalls wird typischerweise verwendet, um häufige Passwort-Anmeldeversuche innerhalb kurzer Zeit zu begrenzen und Brute-Force-Angriffe zu verhindern.
- Ob ein Benutzer nach Überschreiten des Limits gesperrt werden soll, muss unter Berücksichtigung der tatsächlichen Nutzungsszenarien entschieden werden. Die Einstellung der Sperrdauer kann böswillig ausgenutzt werden, da Angreifer absichtlich mehrmals falsche Passwörter für ein Zielkonto eingeben könnten, um das Konto zu sperren und unbrauchbar zu machen. Dies kann durch die Kombination von IP-Beschränkungen, API-Ratenbegrenzungen und anderen Maßnahmen verhindert werden.
- Da eine Kontosperrung den Zugriff auf das System, einschließlich Administratorkonten, verhindert, ist es ratsam, im System mehrere Konten einzurichten, die berechtigt sind, Benutzer zu entsperren.