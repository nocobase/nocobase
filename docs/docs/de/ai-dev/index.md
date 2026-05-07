---
title: "Schnellstart: KI-gestützte Plugin-Entwicklung"
description: "Entwickeln Sie NocoBase-Plugins mit KI-Unterstützung. Beschreiben Sie Ihre Anforderungen in einem Satz und lassen Sie automatisch Frontend- und Backend-Code, Datentabellen, Berechtigungskonfigurationen und Internationalisierung generieren."
keywords: "KI-Entwicklung,AI Development,NocoBase AI,Plugin-Entwicklung,KI-Programmierung,Skills,Schnellstart"
---

# Schnellstart: KI-gestützte Plugin-Entwicklung

Das KI-Entwicklungs-Plugin ist eine von NocoBase bereitgestellte Funktion zur KI-gestützten Plugin-Entwicklung. Sie können Ihre Anforderungen in natürlicher Sprache beschreiben, und die KI generiert automatisch vollständigen Frontend- und Backend-Code, einschließlich Datentabellen, APIs, Frontend-Blöcken, Berechtigungen und Internationalisierung. Das Ergebnis ist ein modernerer und effizienterer Entwicklungsworkflow für Plugins.

Die Funktionalität des KI-Entwicklungs-Plugins basiert auf dem [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development) Skill. Wenn Sie die Initialisierung bereits über die NocoBase CLI (`nb init`) durchgeführt haben, wird dieses Skill automatisch installiert.

## Schnellstart

Wenn Sie die [NocoBase CLI](../ai/quick-start.md) bereits installiert haben, können Sie diesen Schritt überspringen.

### KI-Installation mit einem Klick

Kopieren Sie die folgende Eingabeaufforderung an Ihren KI-Assistenten (Claude Code, Codex, Cursor, Trae usw.), um die Installation und Konfiguration automatisch abzuschließen:

```
Hilf mir bei der Installation der NocoBase CLI und der Initialisierung: https://docs.nocobase.com/de/ai/ai-quick-start.md (bitte rufe den Link direkt auf)
```

### Manuelle Installation

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Der Browser öffnet automatisch eine grafische Konfigurationsseite, die Sie durch die Installation der NocoBase Skills, die Konfiguration der Datenbank und den Start der Anwendung führt. Detaillierte Schritte finden Sie unter [Schnellstart](../ai/quick-start.md).

:::warning Hinweis

- NocoBase befindet sich derzeit in der Migration von `client` (v1) zu `client-v2`. `client-v2` befindet sich noch in der Entwicklung. Der von der KI-Entwicklung generierte Client-Code basiert auf `client-v2` und kann nur unter dem Pfad `/v2/` verwendet werden. Er ist als Vorschau gedacht und nicht für den direkten Einsatz in der Produktion empfohlen.
- Der von der KI generierte Code ist nicht zwangsläufig zu 100 % korrekt. Es wird empfohlen, ihn vor der Aktivierung zu überprüfen. Wenn zur Laufzeit Probleme auftreten, können Sie die Fehlermeldung an die KI senden, damit diese die Fehlersuche und -behebung fortsetzt – meist sind nur wenige Konversationsrunden erforderlich.
- Für die Entwicklung werden große Sprachmodelle der GPT- oder Claude-Reihe empfohlen, da sie die besten Ergebnisse liefern. Andere Modelle funktionieren ebenfalls, die Generierungsqualität kann jedoch variieren.

:::

## Von einem Satz zum vollständigen Plugin

Nach der Installation können Sie der KI direkt in natürlicher Sprache mitteilen, welches Plugin Sie entwickeln möchten. Im Folgenden finden Sie einige reale Szenarien, anhand derer Sie die Möglichkeiten der KI-Entwicklung erleben können.

### Watermark-Plugin mit einem Satz entwickeln

Mit einer einzigen Eingabeaufforderung kann die KI ein vollständiges Watermark-Plugin für Sie generieren – einschließlich Frontend-Rendering-Logik, Manipulationsschutz, Backend-API für Einstellungsspeicherung und Plugin-Einstellungsseite.

```
Hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Watermark-Plugin zu entwickeln.
Anforderungen: Halbtransparentes Wasserzeichen über die Seite legen, das den Namen des aktuell angemeldeten Benutzers anzeigt, um Screenshot-Lecks zu verhindern.
Regelmäßig prüfen, ob das Wasserzeichen-DOM gelöscht wurde; falls ja, neu generieren.
Auf der Plugin-Einstellungsseite die Konfiguration von Wasserzeichentext, Transparenz und Schriftgröße unterstützen.
Plugin-Name: @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

Während des gesamten Prozesses müssen Sie nur Anforderungen beschreiben und Entscheidungen treffen – um den Rest kümmert sich die KI automatisch. Möchten Sie den vollständigen Ablauf sehen? → [Praxisbeispiel: Watermark-Plugin entwickeln](./watermark-plugin)

### Eine benutzerdefinierte Feldkomponente mit einem Satz erstellen

Möchten Sie ein Integer-Feld als Sterne-Bewertung anzeigen lassen? Beschreiben Sie der KI den gewünschten Anzeigeeffekt, und sie generiert ein benutzerdefiniertes FieldModel, das die Standard-Renderkomponente des Felds ersetzt.

```
Bitte hilf mir mit dem nocobase-plugin-development Skill, ein NocoBase-Plugin namens @my-scope/plugin-rating zu entwickeln.
Erstelle eine benutzerdefinierte Anzeigekomponente (FieldModel), die ein Integer-Feld als Sterne-Symbole rendert.
Es soll eine Bewertung von 1–5 unterstützen; durch Klick auf die Sterne kann der Bewertungswert direkt geändert und in die Datenbank gespeichert werden.
```

![Anzeigeeffekt der Rating-Komponente](https://static-docs.nocobase.com/20260422170712.png)

Weitere Informationen zur Verwendung der Funktionen finden Sie unter [Unterstützte Funktionen](./capabilities).

## Was die KI für Sie tun kann

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

Detaillierte Beschreibungen jeder Funktion und Beispiele für Eingabeaufforderungen → [Unterstützte Funktionen](./capabilities)

## Verwandte Links

- [Praxisbeispiel: Watermark-Plugin entwickeln](./watermark-plugin) — Vollständiges Praxisbeispiel zur KI-gestützten Plugin-Entwicklung, von einem Satz bis zum lauffähigen Plugin
- [Unterstützte Funktionen](./capabilities) — Alle Aufgaben, die die KI für Sie übernehmen kann, mit Beispielen für Eingabeaufforderungen
- [NocoBase CLI](../ai/quick-start.md) — Kommandozeilen-Tool zur Installation und Verwaltung von NocoBase
- [NocoBase CLI Referenz](../api/cli/index.md) — Vollständige Parameterbeschreibung aller Befehle
- [Plugin-Entwicklung](../plugin-development/index.md) — Vollständige Anleitung zur NocoBase Plugin-Entwicklung
- [Schnellstart KI-Builder](../ai-builder/index.md) — NocoBase-Anwendungen mit KI erstellen (ohne Code zu schreiben)
