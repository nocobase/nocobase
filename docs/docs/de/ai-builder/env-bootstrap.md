---
title: "Umgebungsverwaltung"
description: "Der Umgebungsverwaltungs-Skill kümmert sich um Installation, Upgrade, Stoppen, Starten und Multi-Umgebungsverwaltung von NocoBase – etwa Entwicklungs-, Test- und Produktionsumgebung – von „NocoBase ist noch nicht installiert" bis „kann angemeldet und genutzt werden"."
keywords: "KI-Builder,Umgebungsverwaltung,Installation,Upgrade,Docker"
---

# Umgebungsverwaltung

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

## Einführung

Der Umgebungsverwaltungs-Skill kümmert sich um Installation, Upgrade, Stoppen, Starten und Multi-Umgebungsverwaltung von NocoBase – etwa Entwicklungs-, Test- und Produktionsumgebung – von „NocoBase ist noch nicht installiert" bis „kann angemeldet und genutzt werden".


## Funktionsumfang

- Abfrage von NocoBase-Umgebungen und deren Status
- Hinzufügen, Entfernen und Wechseln von NocoBase-Instanzumgebungen
- Installation, Upgrade, Stoppen und Starten von NocoBase-Instanzen


## Beispiel-Prompts

### Szenario A: Umgebungsstatus abfragen
Prompt-Modus
```
Welche NocoBase-Instanzen gibt es derzeit? In welcher Umgebung bin ich aktuell?
```
CLI-Modus
```
nb env list
```

### Szenario B: Bestehende Umgebung hinzufügen
:::tip Voraussetzung

Sie benötigen eine bestehende NocoBase-Instanz, lokal oder remote.

:::

Prompt-Modus
```
Bitte füge die Umgebung dev unter http://localhost:13000 hinzu.
```
CLI-Modus
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Szenario C: Neue NocoBase-Instanz installieren
:::tip Voraussetzung

Am bequemsten und schnellsten lässt sich NocoBase im Docker-Modus installieren. Stellen Sie vor der Ausführung sicher, dass auf Ihrem Rechner Node, Docker und Yarn installiert sind.

:::

Prompt-Modus
```
Bitte installiere NocoBase.
```
CLI-Modus
```
nb init --ui
```

### Szenario D: Instanz-Upgrade

Prompt-Modus
```
Bitte aktualisiere die aktuelle Instanz auf die neueste Version.
```
CLI-Modus
```
nb upgrade
```

### Szenario E: Instanz stoppen

Prompt-Modus
```
Bitte stoppe die aktuelle Instanz.
```
CLI-Modus
```
nb app stop
```

### Szenario E: Instanz starten

Prompt-Modus
```
Bitte starte die aktuelle Instanz.
```
CLI-Modus
```
nb app start
```

## Häufige Fragen

**Was tun, wenn nach abgeschlossener Installation die KI-Builder-Funktionen nicht verfügbar sind?**

Aktuell sind alle KI-Builder-Funktionen im Alpha-Image enthalten. Prüfen Sie, ob Sie für die Installation dieses Image verwendet haben. Falls nicht, können Sie auf dieses Image upgraden.

**Was tun, wenn beim Docker-Start ein Portkonflikt auftritt?**

Wechseln Sie auf einen anderen Port (z. B. `port=14000`) oder beenden Sie zunächst den Prozess, der Port 13000 belegt. Die Vorprüfungsphase des Skills weist aktiv auf Portkonflikte hin.

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [NocoBase CLI](../ai/quick-start.md) – Befehlszeilen-Tool zur Installation und Verwaltung von NocoBase
