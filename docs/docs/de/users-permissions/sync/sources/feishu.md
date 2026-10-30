---
pkg: '@nocobase/plugin-feishu'
title: "Benutzerdaten aus Feishu synchronisieren"
description: "Feishu-Benutzer und -Abteilungen mit NocoBase synchronisieren und inkrementelle Änderungen per HTTP-Callback oder Stream-Modus empfangen."
keywords: "Feishu,Lark,Benutzersynchronisation,Abteilungssynchronisation,Stream-Modus,Ereignis-Callback,NocoBase"
---

# Benutzerdaten aus Feishu synchronisieren

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Einführung

Das **Feishu / Lark** Plugin synchronisiert Benutzer und Abteilungen einer Feishu-Organisation nach NocoBase. Es unterstützt die vollständige Synchronisierung auf Anforderung sowie inkrementelle Aktualisierungen per HTTP-Callback oder Stream-Verbindung.

## Vorbereitung

1. Installieren und aktivieren Sie die Plugins **Feishu / Lark** und **Benutzerdatensynchronisierung**.
2. Erstellen Sie eine unternehmensinterne App auf der Feishu Open Platform, siehe [Authentifizierung: Feishu / Lark](/auth-verification/auth-feishu/).
3. Aktivieren Sie die Kontakt-Berechtigungen und konfigurieren Sie den Sichtbarkeitsbereich wie unten beschrieben.

## Kontakt-Berechtigungen und Sichtbarkeitsbereich

Aktivieren Sie unter **Berechtigungen** der App die folgenden Rechte:

| Berechtigung | Scope | Erforderlich | Zweck |
| --- | --- | --- | --- |
| Benutzergrunddaten abrufen | `contact:user.base:readonly` | Ja | Liest Namen, `open_id` / `union_id` und weitere Grundfelder. |
| Abteilungsgrunddaten abrufen | `contact:department.base:readonly` | Ja | Liest Abteilungsnamen und Hierarchie. |
| Abteilungsorganisationsstruktur abrufen | `contact:department.organize:readonly` | Ja | Durchläuft Unterabteilungen; liest Abteilungsleiter. |
| Benutzerorganisationsstruktur abrufen | `contact:user.department:readonly` | Ja | Liest Abteilungen und Hauptabteilung des Benutzers. |
| Benutzer-User-ID abrufen | `contact:user.id:readonly` | Für Kennzeichen `user_id` | Liest das Feld `user_id`. |
| Benutzertelefonnummer abrufen | `contact:user.phone:readonly` | Für Telefon-Sync | Liest Telefonnummern; erforderlich bei Kennzeichen `mobile`. |
| Benutzer-E-Mail abrufen | `contact:user.email:readonly` | Für E-Mail-Sync | Liest E-Mails; erforderlich bei Kennzeichen `email`. |

Konfigurieren Sie anschließend den **Berechtigungsbereich für Kontakte** (welche Abteilungen und Mitglieder die App sehen darf):

1. Klicken Sie auf der Seite **Entwicklungskonfiguration → Berechtigungen** rechts in der Spalte „Zugänglicher Datenbereich" auf **Konfigurieren** (beim Aktivieren einer Kontakt-Berechtigung wird automatisch dorthin gesprungen).
2. Wählen Sie die Abteilungen und Mitglieder; für die Ersteinrichtung empfiehlt sich **Alle Mitglieder**, danach bei Bedarf eingrenzen.
3. Klicken Sie auf **OK**.

:::warning
Ohne **Benutzergrunddaten abrufen** liefert die API keine Namen und die synchronisierten Spitznamen bleiben leer. Der Berechtigungsbereich für Kontakte und die „Verfügbarkeitsbereich der App" (wer die App nutzen darf) sind zwei unabhängige Einstellungen — nur ersterer beeinflusst die Synchronisierung. API-Berechtigungen bestimmen die lesbaren Felder, der Berechtigungsbereich die lesbaren Abteilungen und Benutzer; beides ist zu konfigurieren. Nach Änderungen eine vollständige Synchronisierung erneut ausführen. Event-Abonnement ersetzt keine Leseberechtigungen: NocoBase ruft bei jedem Event die aktuellen Daten über die Feishu-API ab.
:::

## Feishu-Sync-Quelle hinzufügen

Öffnen Sie **Benutzer & Berechtigungen** → **Synchronisierung** und fügen Sie eine Quelle vom Typ **Feishu / Lark** hinzu:

| Feld | Beschreibung |
| --- | --- |
| Quellenname | Eindeutiger Name der Sync-Quelle. |
| Aktiviert | Startet den Ereignisempfang der Quelle und erlaubt Sync-Aufgaben. |
| Region | `Feishu China` oder `Lark Global`. |
| App ID / App Secret | Zugangsdaten der Feishu-App. Umgebungsvariablen und Secrets werden unterstützt. |
| Eindeutiges Benutzerkennzeichen-Feld | `user_id`, `union_id`, `open_id`, `mobile` oder `email`; empfohlen `union_id`. Muss mit dem Authenticator übereinstimmen; Benutzer ohne Wert werden übersprungen. |
| Ereignis-Empfangsmodus | **HTTP-Callback** oder **Stream-Modus**, siehe unten. |

Speichern und aktivieren Sie die Quelle und klicken Sie auf **Synchronisieren** für die erste vollständige Synchronisierung.

## Wahl des Ereignis-Empfangsmodus

### Stream-Modus

Der Stream-Modus hält eine dauerhafte WebSocket-Verbindung, die vom NocoBase-Server initiiert wird. Keine öffentliche Callback-URL, kein Token, kein Verschlüsselungsschlüssel.

1. Wählen Sie in NocoBase **Stream-Modus**, speichern und aktivieren Sie die Quelle.
2. Stellen Sie auf der Plattform unter **Ereignisse & Callbacks** den Empfang auf **Long Connection (WebSocket)** um und abonnieren Sie die Kontakt-Ereignisse.

Die Verbindung startet automatisch beim Aktivieren (mit automatischer Wiederverbindung) und wird bei Änderung, Deaktivierung oder Löschung der Quelle aktualisiert oder geschlossen.

:::info
Der Stream-Modus benötigt keine öffentliche eingehende Adresse und keinen Reverse-Proxy — geeignet für Intranet-Installationen. Der Verbindungsstatus ist in den Anwendungslogs unter `Feishu stream client` prüfbar.
:::

### HTTP-Callback

1. Wählen Sie in NocoBase **HTTP-Callback** und konfigurieren Sie **Verification Token** und optional **Encrypt Key** — mindestens eines ist erforderlich.
2. Speichern Sie die Quelle und kopieren Sie die angezeigte **Ereignis-Callback-URL**.
3. Konfigurieren Sie auf der Plattform unter **Ereignisse & Callbacks** → **Ereigniskonfiguration** den Empfang per Server-Push, fügen Sie die URL ein und abonnieren Sie die Kontakt-Ereignisse.

Die Callback-URL muss von Feishu erreichbar sein (in Produktion HTTPS). Mit Encrypt Key werden Callback-Inhalte verschlüsselt.

:::warning
Ohne Verification Token oder Encrypt Key werden Callback-Anfragen abgelehnt (401). Nach Umstellung einer Quelle auf den Stream-Modus wird der HTTP-Endpunkt geschlossen (403).
:::

## Unterstützte inkrementelle Ereignisse

| Ereignis | Verarbeitung in NocoBase |
| --- | --- |
| `contact.user.created_v3` | Benutzer erstellen oder aktualisieren. |
| `contact.user.updated_v3` | Benutzer aktualisieren. |
| `contact.user.deleted_v3` | Synchronisierten Benutzer löschen. |
| `contact.department.created_v3` | Abteilung erstellen oder aktualisieren. |
| `contact.department.updated_v3` | Abteilung aktualisieren. |
| `contact.department.deleted_v3` | Synchronisierte Abteilung löschen. |

Benutzer mit der Root-Rolle werden durch die Synchronisierung nie gelöscht.

## Synchronisierte Felder

### Abteilungsfelder

| Feishu-Feld | NocoBase-Feld / Zweck |
| --- | --- |
| `open_department_id` | Eindeutiger Quell-Bezeichner der Abteilung. |
| `name` | Abteilungsname. |
| `parent_department_id` | Übergeordnete Abteilung für die Hierarchie. Abteilungen mit Eltern außerhalb des Bereichs werden als Wurzel synchronisiert. |

### Benutzerfelder

| Feishu-Feld | NocoBase-Feld / Zweck |
| --- | --- |
| Wert des Kennzeichen-Felds | Quell-Bezeichner und Benutzername aus dem **eindeutigen Kennzeichen-Feld**. |
| `name`, sonst `en_name` | Spitzname; bleibt leer, wenn beides fehlt. |
| `mobile` | Telefonnummer. |
| `email` | E-Mail. |
| `department_ids` | Abteilungen des Benutzers; nur innerhalb des Sichtbarkeitsbereichs. |
| `main_department_id` | Hauptabteilung. |

### Abteilungsleiter

Abteilungsleiter aus den Abteilungsdaten werden als Abteilungsverantwortliche synchronisiert: Ein Benutzer kann mehrere Abteilungen leiten, und eine geleitete Abteilung muss nicht die Hauptabteilung sein. Es werden nur Abteilungen im Sichtbarkeitsbereich berücksichtigt. Entfernte Leiter werden bei der nächsten Synchronisierung entfernt; manuell in NocoBase geänderte Leiter können überschrieben werden.

Andere Feishu-Benutzerfelder wie Avatar, Position und Personalnummer werden derzeit nicht synchronisiert.

## Fehlerbehebung

- Leere Ergebnisse oder fehlende Abteilungen: Kontakt-Berechtigungen und Sichtbarkeitsbereich prüfen.
- Leere Spitznamen: **Benutzergrunddaten abrufen** (`contact:user.base:readonly`) aktivieren und vollständig synchronisieren.
- Übersprungene Benutzer: Vorhandensein des Kennzeichen-Werts und Übereinstimmung mit dem Authenticator prüfen.
- HTTP-Callback 401: Verification Token / Encrypt Key fehlen oder sind falsch; 403: Quelle wurde in den Stream-Modus umgestellt.
- Fehler zu `redirect_uri` oder Callback-URL: Adresse auf der Plattform muss exakt der in NocoBase angezeigten entsprechen (einschließlich `APP_PUBLIC_PATH`-Präfix).
- Sync-Aufgabe scheitert an API-Rate-Limit: Limit abwarten und Synchronisierung manuell erneut ausführen.
