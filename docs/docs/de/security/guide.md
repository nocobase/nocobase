---
title: "NocoBase Sicherheitsleitfaden"
description: "NocoBase Sicherheitsleitfaden: Benutzerauthentifizierung, JWT-Token-Strategie, APP_KEY, Zugriffskontrolle, Datenverschlüsselung, IP-Beschränkung, Passwort-Policy, Audit-Log, LocalStorage/SessionStorage."
keywords: "NocoBase Sicherheit,Benutzerauthentifizierung,Token-Strategie,Zugriffskontrolle,Datenverschlüsselung,IP-Beschränkung,Passwort-Policy,Audit-Log,NocoBase"
---

:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# NocoBase Sicherheitsleitfaden

NocoBase legt von der Funktionsgestaltung bis zur Systemumsetzung großen Wert auf die Sicherheit von Daten und Anwendungen. Die Plattform verfügt über integrierte Sicherheitsfunktionen wie Benutzerauthentifizierung, Zugriffskontrolle und Datenverschlüsselung und erlaubt zugleich eine flexible Konfiguration der Sicherheitsstrategien gemäß Ihren Anforderungen. Ob es um den Schutz von Benutzerdaten, die Verwaltung von Zugriffsrechten oder die Trennung von Entwicklungs- und Produktionsumgebungen geht – NocoBase stellt praktische Werkzeuge und Lösungen bereit. Dieser Leitfaden soll Sie bei der sicheren Nutzung von NocoBase unterstützen, damit Sie Ihre Daten, Anwendungen und Umgebungen schützen und gleichzeitig die Systemfunktionen effizient nutzen können.

## Benutzerauthentifizierung

Die Benutzerauthentifizierung dient dazu, die Identität der Benutzer festzustellen, unbefugten Zugriff auf das System zu verhindern und sicherzustellen, dass Identitäten nicht missbraucht werden.

### Token-Schlüssel

Standardmäßig verwendet NocoBase JWT (JSON Web Token) zur Authentifizierung der Server-API. Sie können den Token-Schlüssel über die Umgebungsvariable `APP_KEY` festlegen. Bewahren Sie den Token-Schlüssel sorgfältig auf und vermeiden Sie ein Leck. Beachten Sie: Wird `APP_KEY` geändert, werden bestehende Tokens ungültig.

### Token-Strategie

NocoBase unterstützt folgende Sicherheitsrichtlinien für Benutzer-Tokens:

| Konfiguration | Beschreibung |
| --- | --- |
| Sitzungsdauer | Maximale Gültigkeit einer Anmeldesitzung. Innerhalb dieser Zeit wird der Token automatisch erneuert; nach Ablauf muss sich der Benutzer erneut anmelden. |
| Token-Gültigkeit | Gültigkeit jedes ausgegebenen API-Tokens. Nach Ablauf des Tokens stellt der Server einen neuen Token aus, sofern die Sitzung noch gültig ist und die Refresh-Frist nicht überschritten wurde, andernfalls muss der Benutzer sich erneut anmelden. (Jeder Token kann nur einmal aktualisiert werden.) |
| Refresh-Frist für abgelaufene Tokens | Maximale Frist nach Ablauf eines Tokens, in der dieser noch aktualisiert werden darf |

In der Regel empfehlen wir Administratoren:

- Eine kürzere Token-Gültigkeit zu wählen, um die Expositionszeit zu begrenzen.
- Eine sinnvolle Sitzungsdauer einzustellen, länger als die Token-Gültigkeit, aber nicht zu lang, um Benutzererfahrung und Sicherheit auszubalancieren. Nutzen Sie den automatischen Refresh, damit aktive Sitzungen nicht unterbrochen werden, das Risiko von Langzeit-Sitzungsmissbrauch jedoch sinkt.
- Eine sinnvolle Refresh-Frist zu setzen, damit bei längerer Inaktivität der Token natürlich abläuft und kein neuer mehr ausgestellt wird, um den Missbrauch ungenutzter Sitzungen zu verringern.

### Token-Speicherung im Client

Standardmäßig wird der Benutzer-Token im LocalStorage des Browsers gespeichert. Wenn der Benutzer die Browser-Seite schließt und erneut öffnet, ist eine erneute Anmeldung nicht erforderlich, solange der Token noch gültig ist.

Wenn Sie möchten, dass sich der Benutzer bei jedem Seitenaufruf neu anmelden muss, setzen Sie die Umgebungsvariable `API_CLIENT_STORAGE_TYPE=sessionStorage`, sodass der Token im SessionStorage des Browsers gespeichert wird.

### Passwort-Policy

> Pro-Version oder höher

NocoBase unterstützt Passwortregeln und Sperrstrategien für Anmeldeversuche, um die Sicherheit von NocoBase-Anwendungen mit aktivierter Passwort-Anmeldung zu erhöhen. Lesen Sie [Passwort-Policy](./password-policy/index.md) für eine Erläuterung der einzelnen Konfigurationsoptionen.

#### Passwortregeln

| Konfiguration | Beschreibung |
| --- | --- |
| **Passwortlänge** | Mindestlänge des Passworts; maximal 64 Zeichen. |
| **Passwortkomplexität** | Komplexitätsanforderungen, also welche Zeichenarten enthalten sein müssen. |
| **Benutzername darf nicht im Passwort vorkommen** | Legt fest, ob das Passwort den Benutzernamen enthalten darf. |
| **Passwortverlauf merken** | Anzahl der zuletzt verwendeten Passwörter, die nicht erneut verwendet werden dürfen. |

#### Konfiguration des Passwortablaufs

| Konfiguration | Beschreibung |
| --- | --- |
| **Passwortgültigkeit** | Gültigkeitsdauer des Benutzerpassworts. Der Benutzer muss sein Passwort vor Ablauf ändern, damit die Gültigkeit neu gerechnet wird. Wird das Passwort nicht rechtzeitig geändert, kann es nicht mehr verwendet werden und der Administrator muss es zurücksetzen.<br>Wenn weitere Anmeldemethoden konfiguriert sind, kann der Benutzer diese verwenden. |
| **Benachrichtigungskanal für Passwortablauf** | In den 10 Tagen vor Ablauf wird der Benutzer bei jeder Anmeldung benachrichtigt. |

#### Sicherheit der Passwort-Anmeldung

| Konfiguration | Beschreibung |
| --- | --- |
| **Maximale Anzahl ungültiger Passwortanmeldungen** | Maximale Anzahl von Anmeldeversuchen innerhalb des konfigurierten Zeitintervalls. |
| **Maximales Zeitintervall (Sekunden) für ungültige Passwortanmeldungen** | Zeitintervall in Sekunden, in dem die maximale Anzahl ungültiger Anmeldungen gezählt wird. |
| **Sperrzeit (Sekunden)** | Zeitraum, für den ein Benutzer gesperrt wird, nachdem das Limit ungültiger Anmeldungen überschritten wurde (0 bedeutet keine Begrenzung).<br>Während der Sperre ist der Zugriff über alle Authentifizierungsmethoden verboten, einschließlich API Keys. |

In der Regel empfehlen wir:

- Strenge Passwortregeln, um das Risiko von Erraten und Brute-Force zu verringern.
- Sinnvolle Passwortgültigkeit, um regelmäßige Passwortwechsel zu erzwingen.
- In Kombination mit der Anzahl ungültiger Anmeldungen und dem Zeitintervall, um Brute-Force zu verhindern.
- In Hochsicherheits-Szenarien eine sinnvolle Sperrzeit. Beachten Sie jedoch, dass Sperrzeiten missbraucht werden können: Angreifer könnten gezielt mit falschen Passwörtern den Benutzer sperren. In der Praxis sollten Sie zusätzlich IP-Beschränkungen und API-Frequenzlimits einsetzen.
- Den Standard-Root-Benutzer (Benutzername, E-Mail, Passwort) zu ändern, um Missbrauch zu verhindern.
- Da bei Passwortablauf oder Sperrung – auch des Administrators – kein Zugang mehr besteht, mehrere Benutzer mit Passwort-Reset- und Entsperr-Berechtigung einzurichten.

![](https://static-docs.nocobase.com/202501031618900.png)

### Benutzersperre

> Pro-Version oder höher, im Plugin Passwort-Policy enthalten

Verwaltung von Benutzern, die durch zu viele ungültige Anmeldeversuche gesperrt wurden. Sie können Benutzer manuell entsperren oder verdächtige Benutzer aktiv zur Sperrliste hinzufügen. Gesperrte Benutzer haben keinen Zugriff über irgendeine Authentifizierungsmethode, einschließlich API Keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### API Keys

NocoBase unterstützt den Zugriff auf die System-API über API Keys. Sie können API Keys in der Konfiguration des API-Keys-Plugins anlegen.

- Verbinden Sie API Keys mit den richtigen Rollen und stellen Sie sicher, dass die zugewiesenen Berechtigungen korrekt konfiguriert sind.
- Vermeiden Sie das Leck von API Keys während der Nutzung.
- Wir empfehlen Ihnen, eine Gültigkeitsdauer für API Keys festzulegen und nicht „Niemals ablaufen“ zu wählen.
- Bei verdächtiger Nutzung können Sie den entsprechenden API Key löschen, um ihn ungültig zu machen.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Single Sign-On (SSO)

> Kommerzielles Plugin

NocoBase bietet umfangreiche SSO-Plugins und unterstützt OIDC, SAML 2.0, LDAP, CAS und weitere gängige Protokolle. Außerdem stellt NocoBase eine umfassende Erweiterungsschnittstelle für Authentifizierungsverfahren bereit, mit der weitere Authentifizierungstypen schnell entwickelt und integriert werden können. So können Sie Ihren bestehenden IdP einfach mit NocoBase verknüpfen, Benutzeridentitäten zentral verwalten und die Sicherheit erhöhen.
![](https://static-docs.nocobase.com/202501031619427.png)

### Zwei-Faktor-Authentifizierung (Two-factor authentication)

> Enterprise-Version

Die Zwei-Faktor-Authentifizierung verlangt vom Benutzer beim Anmelden mit Passwort einen zweiten Identitätsnachweis, etwa einen einmaligen, dynamischen Code, der an ein vertrautes Gerät gesendet wird. Damit wird die Identität bestätigt und das Risiko bei einem Passwort-Leck reduziert.

### IP-Zugriffskontrolle

> Enterprise-Version

NocoBase unterstützt Black- und Whitelists für IP-Adressen.

- In sicherheitskritischen Umgebungen können Sie eine IP-Whitelist einrichten, um den Zugriff nur von bestimmten IP-Adressen oder Bereichen zuzulassen.
- Bei öffentlichem Netzwerkzugriff können Sie eine IP-Blacklist verwenden, um bekannte schädliche oder verdächtige Quellen zu blockieren.
- Abgelehnte Zugriffe werden protokolliert.

## Zugriffskontrolle

Durch das Anlegen von Rollen und das Zuweisen von Berechtigungen können Sie die Zugriffsrechte von Benutzern detailliert steuern. Administratoren sollten die Konfiguration entsprechend dem Anwendungsfall vornehmen, um das Risiko von Datenlecks zu verringern.

### Root-Benutzer

Bei der ersten Installation legt NocoBase einen Root-Benutzer an. Es wird empfohlen, dessen Daten über Umgebungsvariablen anzupassen, um Missbrauch zu vermeiden.

- `INIT_ROOT_USERNAME` – Benutzername des Root-Benutzers
- `INIT_ROOT_EMAIL` – E-Mail-Adresse des Root-Benutzers
- `INIT_ROOT_PASSWORD` – Passwort des Root-Benutzers; setzen Sie ein starkes Passwort.

Im weiteren Betrieb sollten Sie weitere Administratorkonten anlegen und nutzen und den Root-Benutzer möglichst nicht direkt verwenden.

### Rollen und Berechtigungen

NocoBase steuert den Zugriff auf Ressourcen, indem Rollen angelegt, mit Berechtigungen versehen und Benutzern zugewiesen werden. Jeder Benutzer kann mehrere Rollen besitzen und durch Wechsel der Rolle aus unterschiedlichen Perspektiven arbeiten. Mit dem Department-Plugin lassen sich Rollen auch an Abteilungen binden, sodass Benutzer die Rollen ihrer Abteilung erben.

![](https://static-docs.nocobase.com/202501031620965.png)

### Berechtigungen für Systemkonfiguration

Zu den Konfigurationsberechtigungen gehören:

- Ob die Konfigurationsoberfläche genutzt werden darf
- Ob Plugins installiert, aktiviert oder deaktiviert werden dürfen
- Ob Plugins konfiguriert werden dürfen
- Ob Cache geleert und die Anwendung neu gestartet werden darf
- Konfigurationsberechtigungen für die einzelnen Plugins

### Menüberechtigungen

Menüberechtigungen steuern den Zugriff auf verschiedene Menüseiten, sowohl in der Desktop- als auch in der mobilen Variante.
![](https://static-docs.nocobase.com/202501031620717.png)

### Datenberechtigungen

NocoBase bietet eine feingranulare Steuerung der Zugriffsrechte auf Daten, sodass jeder Benutzer nur die Daten sieht, die für seine Aufgaben relevant sind, und Datenlecks oder Missbrauch verhindert werden.

#### Globale Steuerung

![](https://static-docs.nocobase.com/202501031620866.png)

#### Steuerung auf Tabellen- und Field-Ebene

![](https://static-docs.nocobase.com/202501031621047.png)

#### Steuerung des Datenbereichs

Legt den Datenbereich fest, auf den der Benutzer zugreifen darf. Beachten Sie, dass dies nicht mit dem Datenbereich eines Blocks identisch ist: Der Datenbereich eines Blocks dient meist nur zur Filterung im Frontend. Wenn der Datenzugriff serverseitig streng beschränkt werden soll, müssen Sie hier konfigurieren.

![](https://static-docs.nocobase.com/202501031621712.png)

## Datensicherheit

NocoBase bietet wirksame Mechanismen zur Sicherstellung der Datensicherheit bei Speicherung und Sicherung.

### Passwortspeicherung

NocoBase verschlüsselt Benutzerpasswörter mit dem scrypt-Algorithmus und speichert sie verschlüsselt, was wirksamen Schutz vor groß angelegten Hardware-Angriffen bietet.

### Umgebungsvariablen und Schlüssel

Wenn Sie Drittanbieter-Dienste in NocoBase nutzen, empfehlen wir, deren Schlüssel in Umgebungsvariablen zu konfigurieren und verschlüsselt zu speichern. Das ist sowohl in verschiedenen Umgebungen praktisch als auch sicherer. Details finden Sie in der zugehörigen Dokumentation.

:::warning
Standardmäßig werden Schlüssel mit AES-256-CBC verschlüsselt. NocoBase generiert automatisch einen 32-Byte-Verschlüsselungsschlüssel und speichert ihn unter storage/.data/environment/aes_key.dat. Bewahren Sie diese Schlüsseldatei sicher auf, damit sie nicht entwendet werden kann. Beim Migrieren der Daten muss die Schlüsseldatei mit übertragen werden.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Dateispeicherung

Wenn Sie sensible Dateien speichern müssen, empfehlen wir Cloud-Storage mit S3-Protokoll, kombiniert mit dem kommerziellen Plugin File storage: S3 (Pro), um Lese- und Schreibrechte privat zu halten. In Intranet-Umgebungen empfiehlt sich der Einsatz von MinIO oder ähnlichen S3-kompatiblen, privat betreibbaren Speicheranwendungen.

![](https://static-docs.nocobase.com/202501031623549.png)

### Anwendungs-Backup

Um Datenverlust zu vermeiden, empfehlen wir regelmäßige Backups Ihrer Datenbank.

Open-Source-Anwender können sich an https://www.nocobase.com/en/blog/nocobase-backup-restore orientieren, um Datenbank-Tools für Backups zu nutzen, und sollten die Backup-Dateien sicher verwahren.

Pro- und höher-Anwender können den Backup Manager nutzen, der folgende Funktionen bietet:

- Automatische zeitgesteuerte Backups: regelmäßige Backups sparen Zeit und manuellen Aufwand und erhöhen die Datensicherheit.
- Synchronisation der Backup-Dateien in Cloud-Storage: Trennt Backup-Dateien vom Anwendungsdienst, damit Serverausfälle nicht zum Verlust der Backups führen.
- Verschlüsselung der Backup-Dateien: Vergeben Sie ein Passwort für Backups, um das Risiko bei einem Leak zu mindern.

![](https://static-docs.nocobase.com/202501031623107.png)

## Sicherheit der Laufzeitumgebung

Eine korrekte Bereitstellung von NocoBase und eine sichere Laufzeitumgebung sind ein Schlüssel zur sicheren Nutzung der Anwendung.

### HTTPS-Bereitstellung

Um Man-in-the-Middle-Angriffe zu verhindern, empfehlen wir, das NocoBase-Site mit einem SSL/TLS-Zertifikat auszustatten, damit Daten während der Übertragung geschützt sind.

### Verschlüsselung der API-Übertragung

> Enterprise-Version

In Umgebungen mit besonders strengen Sicherheitsanforderungen unterstützt NocoBase die Verschlüsselung der API-Übertragung, sodass Anfragen und Antworten nicht im Klartext übertragen werden und das Knacken der Daten erschwert wird.

### On-Premises-Bereitstellung

Standardmäßig kommuniziert NocoBase nicht mit Dritt-Diensten und das NocoBase-Team sammelt keinerlei Informationen der Benutzer. Nur in den folgenden zwei Fällen ist eine Verbindung zum NocoBase-Server erforderlich:

1. Automatischer Download kommerzieller Plugins über die NocoBase-Service-Plattform.
2. Online-Validierung und -Aktivierung kommerzieller Anwendungen.

Wenn Sie auf etwas Komfort verzichten möchten, können beide Vorgänge auch offline ausgeführt werden, ohne den NocoBase-Server zu kontaktieren.

NocoBase unterstützt eine vollständige Bereitstellung im Intranet, siehe

- https://www.nocobase.com/en/blog/load-docker-image

### Trennung mehrerer Umgebungen

> Pro-Version oder höher

In der Praxis empfehlen wir Unternehmenskunden, Test- und Produktionsumgebung zu trennen, um die Sicherheit der Anwendungsdaten und der Laufzeitumgebung in der Produktion zu gewährleisten. Mit dem Migration-Manager-Plugin lassen sich Anwendungsdaten zwischen Umgebungen migrieren.

![](https://static-docs.nocobase.com/202501031627729.png)

## Audit und Monitoring

### Audit-Log

> Enterprise-Version

Das Audit-Log von NocoBase zeichnet die Aktivitäten der Benutzer im System auf. Durch die Aufzeichnung wichtiger Operationen und Zugriffe können Administratoren:

- IP, Gerät und Zeitpunkt der Operationen prüfen, um auffälliges Verhalten frühzeitig zu erkennen.
- Den Bearbeitungsverlauf von Datenressourcen nachverfolgen.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Anwendungslogs

NocoBase bietet verschiedene Logtypen, mit denen Sie den Systemzustand und das Verhalten verstehen, Probleme schnell erkennen und Sicherheit sowie Steuerbarkeit aus mehreren Perspektiven gewährleisten können. Wichtige Logtypen:

- Request-Log: API-Anfragen, einschließlich URL, HTTP-Methode, Anfrageparameter, Antwortzeit und Statuscode.
- Systemlog: Anwendungsereignisse wie Dienststart, Konfigurationsänderungen, Fehler und kritische Operationen.
- SQL-Log: Datenbankoperationen und ihre Ausführungszeit, einschließlich Abfragen, Updates, Inserts und Deletes.
- Workflow-Log: Ausführungsprotokoll der Workflows, einschließlich Ausführungszeit, Laufzeitinformationen und Fehlermeldungen.
