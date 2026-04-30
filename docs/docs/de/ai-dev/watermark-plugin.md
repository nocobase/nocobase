---
title: "Praxisbeispiel: Watermark-Plugin entwickeln"
description: "Entwickeln Sie mit einem Satz KI-gestützt ein NocoBase-Watermark-Plugin: Wasserzeichen-Overlay auf Seiten, Manipulationsschutz, konfigurierbare Wasserzeichenparameter."
keywords: "KI-Entwicklung,Watermark-Plugin,NocoBase-Plugin,Praxisbeispiel,KI-Programmierung"
---

# Praxisbeispiel: Watermark-Plugin entwickeln

Dieses Beispiel zeigt, wie Sie mit nur einem Satz die KI dazu bringen, ein vollständiges NocoBase-Watermark-Plugin zu entwickeln – vom Erstellen des Gerüsts bis zur Aktivierungsprüfung wird der gesamte Prozess von der KI durchgeführt.

## Endergebnis

Nach Aktivierung des Plugins:

- Ein halbtransparentes Wasserzeichen wird über die NocoBase-Seiten gelegt und zeigt den Namen des aktuell angemeldeten Benutzers an
- Das Wasserzeichen kann nicht durch Löschen des DOM entfernt werden – eine regelmäßige Prüfung generiert es automatisch neu
- Unter „Plugin-Konfiguration" können Wasserzeichentext, Transparenz und Schriftgröße angepasst werden

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## Voraussetzungen

:::tip Empfohlene Vorablektüre

- [NocoBase CLI](../ai/quick-start.md) — NocoBase installieren und starten
- [Schnellstart: KI-gestützte Plugin-Entwicklung](./index.md) — Skills installieren

:::

Stellen Sie sicher, dass Sie:

1. Eine laufende NocoBase-Entwicklungsumgebung haben (NocoBase Skills werden bei der Initialisierung der NocoBase CLI automatisch installiert)
2. Einen Editor mit KI-Agent-Unterstützung geöffnet haben (z. B. Claude Code, Codex, Cursor usw.)

:::warning Hinweis

- NocoBase befindet sich derzeit in der Migration von `client` (v1) zu `client-v2`. `client-v2` befindet sich noch in der Entwicklung. Der von der KI-Entwicklung generierte Client-Code basiert auf `client-v2` und kann nur unter dem Pfad `/v2/` verwendet werden. Er ist als Vorschau gedacht und nicht für den direkten Einsatz in der Produktion empfohlen.
- Der von der KI generierte Code ist nicht zwangsläufig zu 100 % korrekt. Es wird empfohlen, ihn vor der Aktivierung zu überprüfen. Wenn zur Laufzeit Probleme auftreten, können Sie die Fehlermeldung an die KI senden, damit diese die Fehlersuche und -behebung fortsetzt – meist sind nur wenige Konversationsrunden erforderlich.

:::

## Loslegen

Senden Sie im Stammverzeichnis Ihres NocoBase-Projekts die folgende Eingabeaufforderung an die KI:

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

## Was die KI gemacht hat

Nachdem die KI die Anforderungen erhalten hat, führt sie folgende Schritte automatisch aus:

### 1. Anforderungen analysieren und Plan bestätigen

Die KI analysiert zunächst, welche NocoBase-Erweiterungspunkte dieses Plugin benötigt, und stellt Ihnen einen Entwicklungsplan vor. Zum Beispiel:

> **Serverseite:**
> - Eine `watermarkSettings`-Datentabelle, die die Wasserzeichenkonfiguration speichert (Text, Transparenz, Schriftgröße)
> - Eine benutzerdefinierte API zum Lesen und Schreiben der Wasserzeichenkonfiguration
> - ACL-Konfiguration: Angemeldete Benutzer können lesen, Administratoren können schreiben
>
> **Clientseite:**
> - Plugin-Einstellungsseite mit einem Formular zur Konfiguration der Wasserzeichenparameter
> - Wasserzeichen-Renderlogik: Wasserzeichen über die Seite legen, nachdem die Konfiguration gelesen wurde
> - Manipulationsschutz: Timer überwacht das Wasserzeichen-DOM

Nach Bestätigung des Plans beginnt die KI mit der Codegenerierung.

<!-- Benötigt einen Terminal-Screenshot, der die Ausgabe des Entwicklungsplans der KI zeigt -->

### 2. Plugin-Gerüst erstellen

```bash
yarn pm create @my-project/plugin-watermark
```

Die KI generiert unter `packages/plugins/@my-project/plugin-watermark/` die Standard-Verzeichnisstruktur des Plugins.

### 3. Serverseitigen Code schreiben

Die KI generiert folgende Dateien:

- **Datentabellendefinition** — `watermarkSettings`-Tabelle mit den Feldern `text`, `opacity`, `fontSize`
- **Benutzerdefinierte API** — Schnittstellen zum Lesen und Aktualisieren der Wasserzeichenkonfiguration
- **ACL-Konfiguration** — Angemeldete Benutzer können die Wasserzeichenkonfiguration lesen, Administratoren können sie ändern

<!-- Benötigt einen Terminal-Screenshot, der zeigt, wie die KI serverseitigen Code generiert -->

### 4. Clientseitigen Code schreiben

- **Plugin-Einstellungsseite** — Ein Ant Design Formular zur Konfiguration von Wasserzeichentext, Transparenz (Schieberegler) und Schriftgröße
- **Wasserzeichen-Rendering** — Erstellt eine bildschirmfüllende Canvas-/Div-Overlay-Schicht auf der Seite, die den Namen des aktuell angemeldeten Benutzers anzeigt
- **Manipulationsschutz** — Doppelte Absicherung durch `MutationObserver` und Timer; bei Löschen des DOM wird sofort neu generiert

<!-- Benötigt einen Terminal-Screenshot, der zeigt, wie die KI clientseitigen Code generiert -->

### 5. Internationalisierung

Die KI generiert automatisch Sprachpakete für Chinesisch und Englisch, ohne dass Sie zusätzlich aktiv werden müssen:

- `src/locale/zh-CN.json` — Chinesische Übersetzung
- `src/locale/en-US.json` — Englische Übersetzung

### 6. Plugin aktivieren

```bash
yarn pm enable @my-project/plugin-watermark
```

Nach der Aktivierung sehen Sie beim Öffnen einer NocoBase-Seite das Wasserzeichen über dem Inhalt.

<!-- Benötigt ein Video: vollständiger Ablauf von Eingabeaufforderung → KI generiert Code → Plugin aktivieren → Wasserzeichen erscheint auf der Seite → Einstellungsseite öffnen und Parameter ändern → Wasserzeichen passt sich an -->

## Wie lange hat der gesamte Prozess gedauert?

Von der Eingabeaufforderung bis zur Verwendbarkeit des Plugins vergehen etwa **3–5 Minuten**. Die KI hat folgende Aufgaben erledigt:

| Aufgabe                          | Geschätzte manuelle Entwicklung | KI-Bearbeitung   |
| -------------------------------- | ------------------------------- | ---------------- |
| Gerüst erstellen                 | 2 Minuten                       | Automatisch      |
| Datentabelle + API               | 20 Minuten                      | Automatisch      |
| Plugin-Einstellungsseite         | 30 Minuten                      | Automatisch      |
| Wasserzeichen-Rendering + Manipulationsschutz | 40 Minuten         | Automatisch      |
| ACL-Konfiguration                | 10 Minuten                      | Automatisch      |
| Internationalisierung            | 15 Minuten                      | Automatisch      |
| **Gesamt**                       | **~2 Stunden**                  | **~5 Minuten**   |


## Möchten Sie weitere Plugins entwickeln?

Das Watermark-Plugin betrifft hauptsächlich Frontend-Rendering und einfache Backend-Speicherung. Wenn Sie wissen möchten, was die KI sonst noch für Sie tun kann – wie benutzerdefinierte Blöcke, komplexe Datentabellenbeziehungen, Workflow-Erweiterungen usw. –, werfen Sie einen Blick auf [Unterstützte Funktionen](./capabilities).

## Verwandte Links

- [Schnellstart: KI-gestützte Plugin-Entwicklung](./index.md) — Schnellstart und Funktionsübersicht
- [Unterstützte Funktionen](./capabilities) — Alle Aufgaben, die die KI für Sie übernehmen kann, mit Beispielen für Eingabeaufforderungen
- [Plugin-Entwicklung](../plugin-development/index.md) — Vollständige Anleitung zur NocoBase Plugin-Entwicklung
- [NocoBase CLI](../ai/quick-start.md) — Kommandozeilen-Tool zur Installation und Verwaltung von NocoBase
