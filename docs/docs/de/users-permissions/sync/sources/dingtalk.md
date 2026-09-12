---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Benutzerdaten aus DingTalk synchronisieren"
description: "DingTalk-Benutzer und -Abteilungen mit NocoBase synchronisieren und inkrementelle Änderungen per HTTP-Callback oder Stream-Modus empfangen."
keywords: "DingTalk,Benutzersynchronisation,Abteilungssynchronisation,Stream-Modus,Ereignisabonnement,NocoBase"
---

# Benutzerdaten aus DingTalk synchronisieren

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Einführung

Das Plugin **DingTalk** synchronisiert Benutzer und Abteilungen einer DingTalk-Organisation mit NocoBase. Es unterstützt eine manuelle Vollsynchronisation sowie inkrementelle Aktualisierungen über HTTP-Callback oder Stream-Verbindung.

## Voraussetzungen

1. Installieren und aktivieren Sie die Plugins **DingTalk** und **Benutzerdatensynchronisation**.
2. Erstellen Sie in der DingTalk-Entwicklerkonsole eine unternehmensinterne Anwendung.
3. Erteilen Sie die unten beschriebenen Kontaktberechtigungen und konfigurieren Sie den Datenberechtigungsbereich.
4. Kopieren Sie Client ID und Client Secret. Weitere Informationen finden Sie unter [Authentifizierung: DingTalk](/auth-verification/auth-dingtalk/).

## Kontaktberechtigungen und Datenberechtigungsbereich konfigurieren

Öffnen Sie in der DingTalk-Entwicklerkonsole die **Berechtigungsverwaltung** der Anwendung und erteilen Sie folgende Berechtigungen:

| Berechtigung | Kennung | Erforderlich | Zweck |
| --- | --- | --- | --- |
| Abteilungsinformationen lesen | `qyapi_get_department_list` | Ja | Abteilungsliste, Namen und Hierarchie lesen. |
| Abteilungsmitglieder lesen | `qyapi_get_department_member` | Ja | Mitglieder einer Abteilung lesen. |
| Mitgliedsinformationen lesen | `qyapi_get_member` | Ja | Benutzerdetails und Abteilungszugehörigkeiten lesen. |
| Mobilnummern von Mitarbeitern | `fieldMobile` | Bei Nutzung der Mobilnummer | Mobilnummern synchronisieren; erforderlich, wenn das eindeutige Benutzerfeld `mobile` ist. |
| E-Mail und weitere persönliche Informationen | `fieldEmail` | Nein | Erforderlich, wenn E-Mail-Adressen synchronisiert werden sollen. |

Konfigurieren Sie anschließend den **Datenberechtigungsbereich** der Anwendung so, dass alle zu synchronisierenden Abteilungen und Mitarbeiter enthalten sind. Für eine vollständige Organisationssynchronisation wählen Sie alle Mitarbeiter aus.

:::warning
API-Berechtigungen bestimmen, welche Felder gelesen werden dürfen. Der Datenberechtigungsbereich bestimmt, welche Abteilungen und Mitarbeiter gelesen werden dürfen. Beides muss konfiguriert sein. Ereignisabonnements ersetzen die Leseberechtigungen nicht.
:::

Wenn dieselbe Anwendung auch zur Anmeldung verwendet wird, erteilen Sie zusätzlich die unter [Authentifizierung: DingTalk](/auth-verification/auth-dingtalk/) beschriebenen persönlichen Berechtigungen.

## DingTalk-Synchronisationsquelle hinzufügen

Öffnen Sie **Benutzer & Berechtigungen > Synchronisieren**, klicken Sie auf **Hinzufügen** und wählen Sie **DingTalk**.

| Feld | Beschreibung |
| --- | --- |
| Quellenname | Eindeutiger Name der Synchronisationsquelle. |
| Aktiviert | Startet den Ereignisempfang und erlaubt Synchronisationsaufgaben. |
| Client ID | Client ID der DingTalk-Anwendung; Umgebungsvariablen und Secrets werden unterstützt. |
| Client Secret | Client Secret der DingTalk-Anwendung; Umgebungsvariablen und Secrets werden unterstützt. |
| Eindeutiges Benutzerfeld | `mobile` oder `unionId`. Ändern Sie die Auswahl nach der ersten Synchronisation nicht. Benutzer ohne den gewählten Wert werden übersprungen. |
| Ereignisempfangsmodus | **HTTP-Callback** oder **Stream-Modus** für inkrementelle Änderungen. |

Speichern und aktivieren Sie die Quelle. Führen Sie anschließend über **Synchronisieren** zuerst eine Vollsynchronisation aus.

## Ereignisempfangsmodus auswählen

### Stream-Modus

Der Stream-Modus stellt vom NocoBase-Server aus eine dauerhafte Verbindung zu DingTalk her. Eine öffentliche Callback-URL, ein Token und ein EncodingAESKey sind nicht erforderlich.

1. Wählen Sie in den Ereignisabonnement-Einstellungen von DingTalk den **Stream-Modus**.
2. Abonnieren Sie die benötigten Benutzer- und Abteilungsereignisse.
3. Wählen Sie in NocoBase den **Stream-Modus**, speichern und aktivieren Sie die Quelle.

Der Stream-Client wird beim Aktivieren der Quelle gestartet. Beim Aktualisieren, Deaktivieren oder Löschen wird die Verbindung entsprechend aktualisiert oder geschlossen.

:::info
Der NocoBase-Server muss ausgehende Verbindungen zu DingTalk herstellen können. Ein Reverse Proxy oder eine öffentliche eingehende Callback-Adresse ist nicht erforderlich.
:::

### HTTP-Callback

1. Wählen Sie in NocoBase **HTTP-Callback**.
2. Geben Sie Token und EncodingAESKey aus dem DingTalk-Ereignisabonnement ein.
3. Speichern Sie die Quelle und kopieren Sie die erzeugte **Ereignis-Callback-URL**.
4. Hinterlegen Sie diese URL in DingTalk und abonnieren Sie die Benutzer- und Abteilungsereignisse.

Die Callback-URL muss für DingTalk erreichbar sein. Verwenden Sie in Produktion HTTPS und stellen Sie sicher, dass der Reverse Proxy den Pfad unverändert weiterleitet.

## Unterstützte inkrementelle Ereignisse

| Ereignis | Verarbeitung in NocoBase |
| --- | --- |
| `user_add_org` | Benutzer erstellen oder aktualisieren. |
| `user_modify_org` | Benutzer aktualisieren. |
| `user_leave_org` | Synchronisierten Benutzer löschen. |
| `org_dept_create` | Abteilung erstellen oder aktualisieren. |
| `org_dept_modify` | Abteilung aktualisieren und deren Benutzer synchronisieren. |
| `org_dept_remove` | Synchronisierte Abteilung löschen. |

## Synchronisierte Felder

### Abteilungsfelder

| DingTalk-Feld | NocoBase-Feld oder Zweck |
| --- | --- |
| `dept_id` | Eindeutige Quellkennung der Abteilung. |
| `name` | Abteilungsname. |
| `parent_id` | Übergeordnete Abteilung. Liegt diese außerhalb des Berechtigungsbereichs, wird die Abteilung als Wurzelabteilung synchronisiert. |

### Benutzerfelder

| DingTalk-Feld | NocoBase-Feld oder Zweck |
| --- | --- |
| `mobile` oder `unionid` | Eindeutige Quellkennung und Benutzername entsprechend der Konfiguration. |
| `name` | Anzeigename des Benutzers. |
| `mobile` | Telefonnummer. Erfordert `fieldMobile`. |
| `email`, ersatzweise `org_email` | E-Mail-Adresse. Erfordert `fieldEmail`. |
| `dept_id_list` | Abteilungszugehörigkeiten innerhalb des Datenberechtigungsbereichs. |
| `dept_order_list` | Hauptabteilung. |
| `leader_in_dept` | Kennzeichnet den Benutzer als Verantwortlichen der jeweiligen Abteilung. |

### Abteilungsverantwortliche

NocoBase synchronisiert `leader_in_dept` für jede Abteilung getrennt. Ein Benutzer kann mehrere Abteilungen verantworten; eine verantwortete Abteilung muss nicht die Hauptabteilung sein. Wird die Kennzeichnung in DingTalk entfernt, entfernt die nächste Synchronisation sie auch in NocoBase. Manuelle Änderungen in NocoBase können überschrieben werden.

Vollständige und inkrementelle Synchronisation verwenden dieselbe Feldzuordnung. Profilbild, Position und Mitarbeiternummer werden derzeit nicht synchronisiert.

## Fehlerbehebung

- Prüfen Sie bei leeren oder unvollständigen Ergebnissen die drei erforderlichen Leseberechtigungen und den Datenberechtigungsbereich.
- Prüfen Sie bei fehlender Mobilnummer oder E-Mail die Berechtigungen `fieldMobile` bzw. `fieldEmail`.
- Benutzer ohne das konfigurierte eindeutige Feld werden übersprungen.
- Suchen Sie für den Stream-Modus in den Anwendungsprotokollen nach `Dingtalk stream client starting`, `Dingtalk stream client started` oder Verbindungsfehlern.
- Prüfen Sie beim HTTP-Callback die öffentliche Erreichbarkeit sowie Token und EncodingAESKey.
- Führen Sie nach Änderungen an Berechtigungen oder Datenbereich erneut eine Vollsynchronisation aus.
