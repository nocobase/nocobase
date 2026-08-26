---
title: "Plugin-Verwaltung"
description: "Der Plugin-Verwaltungs-Skill dient dem Anzeigen, Aktivieren und Deaktivieren von NocoBase-Plugins."
keywords: "KI-Builder,Plugin-Verwaltung,Plugin aktivieren,Plugin deaktivieren"
---

# Plugin-Verwaltung

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

## Einführung

Der Plugin-Verwaltungs-Skill dient dem Anzeigen, Aktivieren und Deaktivieren von NocoBase-Plugins – er erkennt automatisch lokale oder Remote-Umgebungen, wählt das passende Ausführungs-Backend und stellt durch Rückleseprüfungen den Erfolg der Operation sicher.


## Funktionsumfang

- Anzeige des Plugin-Verzeichnisses und des Aktivierungsstatus.
- Aktivieren von Plugins.
- Deaktivieren von Plugins.

## Beispiel-Prompts

### Szenario A: Plugin-Status anzeigen

Prompt-Modus
```
Welche Plugins gibt es in der aktuellen Umgebung?
```
CLI-Modus
```
nb plugin list
```

Es werden alle Plugins zusammen mit ihrem Aktivierungsstatus und Versionsinformationen aufgelistet.

![Plugin-Status anzeigen](https://static-docs.nocobase.com/20260417150510.png)

### Szenario B: Plugin aktivieren

Prompt-Modus
```
Bitte aktiviere das Lokalisierungs-Plugin.
```
CLI-Modus
```
nb plugin enable <Lokalisierung>
```

Der Skill aktiviert die Plugins der Reihe nach und prüft nach jeder Aktivierung mit einer Rückleseprüfung, ob `enabled=true` gesetzt ist.

![Plugin aktivieren](https://static-docs.nocobase.com/20260417153023.png)

### Szenario C: Plugin deaktivieren

Prompt-Modus
```
Bitte deaktiviere das Lokalisierungs-Plugin.
```
CLI-Modus
```
nb plugin disable  <Lokalisierung>
```

![Plugin deaktivieren](https://static-docs.nocobase.com/20260417173442.png)

## Häufige Fragen

**Was tun, wenn ein Plugin nach der Aktivierung nicht wirksam wird?**

Manche Plugins werden erst nach einem Neustart der Anwendung wirksam. Der Skill weist im Ergebnis darauf hin, ob ein Neustart erforderlich ist.

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [NocoBase CLI](../ai/quick-start.md) – Befehlszeilen-Tool zur Installation und Verwaltung von NocoBase
