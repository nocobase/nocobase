---
title: "Unterstützte Funktionen"
description: "Alle von der KI-Entwicklung unterstützten Funktionen: Gerüst, Datentabellen, Blöcke, Felder, Aktionen, Einstellungsseiten, APIs, Berechtigungen, Internationalisierung, Upgrade-Skripte."
keywords: "KI-Entwicklung,Funktionen,Plugin-Entwicklung,Gerüst,Datentabelle,Block,Feld,Aktion,Berechtigung,Internationalisierung"
---

# Unterstützte Funktionen

:::tip Voraussetzungen

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie die Umgebungsvorbereitung gemäß dem [Schnellstart: KI-gestützte Plugin-Entwicklung](./index.md) abgeschlossen haben.

:::

Die Funktionalität des KI-Entwicklungs-Plugins basiert auf dem [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development) Skill. Wenn Sie die Initialisierung bereits über die [NocoBase CLI](../ai/quick-start.md) (`nb init`) durchgeführt haben, wird dieses Skill automatisch installiert.

Im Folgenden sind alle Aufgaben aufgelistet, bei denen die KI Ihnen derzeit helfen kann. Zu jeder Funktion gibt es ein Beispiel für eine Eingabeaufforderung, das Sie direkt kopieren und mit angepassten Anforderungen verwenden können.

:::warning Hinweis

- NocoBase befindet sich derzeit in der Migration von `client` (v1) zu `client-v2`. `client-v2` befindet sich noch in der Entwicklung. Der von der KI-Entwicklung generierte Client-Code basiert auf `client-v2` und kann nur unter dem Pfad `/v2/` verwendet werden. Er ist als Vorschau gedacht und nicht für den direkten Einsatz in der Produktion empfohlen.
- Der von der KI generierte Code ist nicht zwangsläufig zu 100 % korrekt. Es wird empfohlen, ihn vor der Aktivierung zu überprüfen. Wenn zur Laufzeit Probleme auftreten, können Sie die Fehlermeldung an die KI senden, damit diese die Fehlersuche und -behebung fortsetzt – meist sind nur wenige Konversationsrunden erforderlich.
- Für die Entwicklung werden große Sprachmodelle der GPT- oder Claude-Reihe empfohlen, da sie die besten Ergebnisse liefern. Andere Modelle funktionieren ebenfalls, die Generierungsqualität kann jedoch variieren.

:::

## Best Practices

- **Teilen Sie der KI klar mit, dass Sie ein NocoBase-Plugin erstellen oder ändern möchten, und geben Sie den Plugin-Namen an** – zum Beispiel: „Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-rating zu entwickeln". Ohne Angabe des Plugin-Namens weiß die KI möglicherweise nicht, wohin sie den Code generieren soll.
- **Geben Sie in der Eingabeaufforderung explizit an, dass das nocobase-plugin-development Skill verwendet werden soll** – zum Beispiel: „Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin zu entwickeln …". So kann der KI-Agent direkt auf die Funktionen des Skills zugreifen, ohne in den Plan-Modus zu wechseln und das Skill zu ignorieren.
- **Führen Sie den KI-Agenten im Stammverzeichnis des NocoBase-Quellcode-Repositorys aus** – so kann die KI automatisch die Projektstruktur, Abhängigkeiten und vorhandenen Plugins finden. Wenn Sie sich nicht im Stammverzeichnis befinden, müssen Sie dem KI-Agenten den Pfad zum Quellcode-Repository zusätzlich mitteilen.

## Schnellindex

| Ich möchte …                              | Die KI kann Ihnen helfen                                                |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Ein neues Plugin erstellen                | Vollständiges Gerüst inklusive Frontend- und Backend-Verzeichnisstruktur generieren |
| Datentabellen definieren                  | Collection-Definition generieren, alle Feldtypen und Beziehungen unterstützen |
| Einen benutzerdefinierten Block erstellen | BlockModel + Konfigurationspanel + Registrierung im Menü „Block hinzufügen" generieren |
| Ein benutzerdefiniertes Feld erstellen    | FieldModel generieren und an Feldschnittstelle binden                   |
| Eine benutzerdefinierte Aktionsschaltfläche hinzufügen | ActionModel + Popup/Drawer/Bestätigungsdialog generieren        |
| Eine Plugin-Einstellungsseite erstellen   | Frontend-Formular + Backend-API + Speicherung generieren                |
| Eine benutzerdefinierte API schreiben     | Resource Action + Routenregistrierung + ACL-Konfiguration generieren    |
| Berechtigungen konfigurieren              | ACL-Regeln generieren, Zugriff nach Rollen steuern                      |
| Mehrsprachigkeit unterstützen             | Sprachpakete für Chinesisch und Englisch automatisch generieren         |
| Upgrade-Skripte schreiben                 | Migration generieren, DDL und Datenmigration unterstützen               |

## Plugin-Gerüst

Die KI kann basierend auf Ihrer Anforderungsbeschreibung eine vollständige Verzeichnisstruktur eines NocoBase-Plugins generieren – einschließlich Frontend- und Backend-Eingangsdateien, Typdefinitionen und Basiskonfiguration.

Beispiel-Eingabeaufforderung:

```
Hilf mir, ein NocoBase-Plugin namens @my-scope/plugin-todo zu erstellen
```

Die KI führt `yarn pm create @my-scope/plugin-todo` aus und generiert das Standardverzeichnis:

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Datentabellendefinition

Die KI unterstützt die Generierung von Collection-Definitionen für alle NocoBase-Feldtypen, einschließlich Beziehungen (Eins-zu-viele, Viele-zu-viele usw.).

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-order zu entwickeln,
und definiere darin eine "Bestellungen"-Tabelle mit folgenden Feldern: Bestellnummer (Auto-Inkrement), Kundenname (String),
Betrag (Dezimalzahl), Status (Einzelauswahl: ausstehend/in Bearbeitung/abgeschlossen), Erstellungsdatum.
Bestellungen und Kunden stehen in einer Viele-zu-Eins-Beziehung.
```

Die KI generiert eine `defineCollection`-Definition mit Feldtypen, Standardwerten, Beziehungskonfigurationen usw.

## Benutzerdefinierte Blöcke

Blöcke sind die wichtigste Erweiterungsmethode des NocoBase-Frontends. Die KI kann Ihnen helfen, Blockmodelle, Konfigurationspanels und Menüregistrierungen zu generieren.

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-simple-block zu entwickeln.
Erstelle einen benutzerdefinierten Anzeigeblock (BlockModel), in dem Benutzer im Konfigurationspanel HTML-Inhalte eingeben können,
und der Block rendert dieses HTML. Registriere diesen Block im Menü „Block hinzufügen".
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Die KI generiert ein `BlockModel`, erstellt das Konfigurationspanel über `registerFlow` + `uiSchema` und registriert es im Menü „Block hinzufügen".

Ein vollständiges Beispiel finden Sie unter [Einen benutzerdefinierten Anzeigeblock erstellen](../plugin-development/client/examples/custom-block).

## Benutzerdefinierte Feldkomponenten

Wenn die in NocoBase integrierten Feldrenderkomponenten Ihren Anforderungen nicht entsprechen, kann die KI Ihnen helfen, eine benutzerdefinierte Anzeigekomponente zu erstellen, die die Standard-Feldrendermethode ersetzt.

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-rating zu entwickeln.
Erstelle eine benutzerdefinierte Anzeigekomponente (FieldModel), die ein Integer-Feld als Sterne-Symbole rendert.
Es soll eine Bewertung von 1–5 unterstützen; durch Klick auf die Sterne kann der Bewertungswert direkt geändert und in die Datenbank gespeichert werden.
```

![Anzeigeeffekt der Rating-Komponente](https://static-docs.nocobase.com/20260422170712.png)

Die KI generiert ein benutzerdefiniertes `FieldModel`, das die Standard-Renderkomponente für Integer-Felder ersetzt.

## Benutzerdefinierte Aktionen

Aktionsschaltflächen können oben im Block (Collection-Ebene), in der Aktionsspalte jeder Tabellenzeile (Record-Ebene) oder gleichzeitig an beiden Stellen erscheinen. Nach einem Klick können Hinweise angezeigt, Formular-Popups geöffnet, APIs aufgerufen werden usw.

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-simple-action zu entwickeln.
Erstelle drei benutzerdefinierte Aktionsschaltflächen (ActionModel):
1. Eine Schaltfläche auf Collection-Ebene, die oben im Block erscheint und nach einem Klick eine Erfolgsmeldung anzeigt
2. Eine Schaltfläche auf Record-Ebene, die in der Aktionsspalte jeder Tabellenzeile erscheint und nach einem Klick die ID des aktuellen Datensatzes anzeigt
3. Eine Schaltfläche auf both-Ebene, die gleichzeitig an beiden Positionen erscheint und nach einem Klick eine Informationsmeldung anzeigt
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Die KI generiert ein `ActionModel`, steuert die Anzeigeposition der Schaltfläche über `ActionSceneEnum` und behandelt Klickereignisse über `registerFlow({ on: 'click' })`.

Ein vollständiges Beispiel finden Sie unter [Eine benutzerdefinierte Aktionsschaltfläche erstellen](../plugin-development/client/examples/custom-action).

## Plugin-Einstellungsseite

Viele Plugins benötigen eine Einstellungsseite, auf der Benutzer Parameter konfigurieren können – beispielsweise API Keys von Drittanbietern, Webhook-Adressen usw.

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-settings-page zu entwickeln.
Erstelle eine Plugin-Einstellungsseite und registriere unter dem Menü „Plugin-Konfiguration" einen Eintrag „Konfiguration externer Dienste" mit zwei Tabs:
1. Tab „API-Konfiguration": Formular mit API Key (String, erforderlich), API Secret (Passwort, erforderlich), Endpoint (String, optional), Speicherung über Backend-API in der Datenbank
2. Tab „Über": Anzeige von Plugin-Name und Versionsinformationen
Verwende für das Frontend Ant Design Formularkomponenten; im Backend definiere die beiden Endpunkte externalApi:get und externalApi:set.
```

![Effekt der Plugin-Einstellungsseite](https://static-docs.nocobase.com/20260415160006.png)

Die KI generiert die Frontend-Einstellungsseitenkomponente, die Backend Resource Action, die Datentabellendefinition und die ACL-Konfiguration.

Ein vollständiges Beispiel finden Sie unter [Eine Plugin-Einstellungsseite erstellen](../plugin-development/client/examples/settings-page).

## Benutzerdefinierte API

Wenn die integrierten CRUD-Schnittstellen nicht ausreichen, kann die KI Ihnen helfen, eine benutzerdefinierte REST API zu schreiben. Im Folgenden ist ein vollständiges Beispiel für ein integriertes Frontend-Backend-Szenario zu sehen – das Backend definiert Datentabellen und API, das Frontend erstellt einen benutzerdefinierten Block zur Datenanzeige.

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-todo zu entwickeln.
Erstelle ein integriertes Frontend-Backend-Plugin zur Verwaltung von Todo-Daten:
1. Im Backend eine todoItems-Tabelle definieren mit den Feldern title (String), completed (Boolean), priority (String, Standard medium)
2. Im Frontend einen benutzerdefinierten TableBlock erstellen, der nur die Daten von todoItems anzeigt
3. Das priority-Feld mit farbigen Tags darstellen (high rot, medium orange, low grün)
4. Eine Schaltfläche „Neues Todo" hinzufügen, die nach einem Klick ein Formular zur Datensatzerstellung öffnet
5. Angemeldete Benutzer können alle CRUD-Operationen ausführen
```

![Effekt des Todo-Datenverwaltungs-Plugins](https://static-docs.nocobase.com/20260408164204.png)

Die KI generiert die serverseitige Collection-Definition, Resource Action, ACL-Konfiguration sowie das clientseitige `TableBlockModel`, das benutzerdefinierte `FieldModel` und `ActionModel`.

Ein vollständiges Beispiel finden Sie unter [Ein integriertes Frontend-Backend-Datenverwaltungs-Plugin erstellen](../plugin-development/client/examples/fullstack-plugin).

## Berechtigungskonfiguration

Die KI konfiguriert automatisch sinnvolle ACL-Regeln für die generierten APIs und Ressourcen. Sie können in der Eingabeaufforderung auch explizite Berechtigungsanforderungen angeben:

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-todo zu entwickeln.
Definiere eine todoItems-Datentabelle (Felder title, completed, priority).
Berechtigungsanforderungen: Angemeldete Benutzer können anzeigen, erstellen und bearbeiten; nur die Rolle admin kann löschen.
```

Die KI konfiguriert auf der Serverseite die entsprechenden Zugriffsregeln über `this.app.acl.allow()`.

## Internationalisierung

Die KI generiert standardmäßig die Sprachpakete für Chinesisch und Englisch (`zh-CN.json` und `en-US.json`); Sie müssen dies nicht zusätzlich erwähnen.

Bei Bedarf für weitere Sprachen:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-order zu entwickeln,
das Sprachpakete für Chinesisch, Englisch und Japanisch unterstützt.
```

## Upgrade-Skripte

Wenn ein Plugin die Datenbankstruktur aktualisieren oder Daten migrieren muss, kann die KI Ihnen helfen, ein Migration-Skript zu generieren.

Beispiel-Eingabeaufforderung:

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein Upgrade-Skript für das NocoBase-Plugin @my-scope/plugin-order zu schreiben.
Füge der "Bestellungen"-Tabelle ein neues Feld "Notiz" (Langtext, optional) hinzu und fülle das Notiz-Feld vorhandener Bestellungen standardmäßig mit "keine".
```

Die KI generiert eine versionierte Migration-Datei mit DDL-Operationen und Datenmigrationslogik.

## Verwandte Links

- [Schnellstart: KI-gestützte Plugin-Entwicklung](./index.md) — Schnellstart und Funktionsübersicht
- [Praxisbeispiel: Watermark-Plugin entwickeln](./watermark-plugin) — Vollständiges Praxisbeispiel zur KI-gestützten Plugin-Entwicklung
- [Plugin-Entwicklung](../plugin-development/index.md) — Vollständige Anleitung zur NocoBase Plugin-Entwicklung
- [NocoBase CLI](../ai/quick-start.md) — Kommandozeilen-Tool zur Installation und Verwaltung von NocoBase
