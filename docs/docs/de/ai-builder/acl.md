---
title: "Berechtigungskonfiguration"
description: "Der Berechtigungskonfigurations-Skill dient dazu, Rollen, Berechtigungsrichtlinien, Benutzerzuordnungen und ACL-Risikobewertungen in NocoBase über natürliche Sprache zu verwalten."
keywords: "KI-Builder,Berechtigungskonfiguration,ACL,Rolle,Berechtigung,Benutzerzuordnung,Risikobewertung"
---

# Berechtigungskonfiguration

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

## Einführung

Der Berechtigungskonfigurations-Skill dient dazu, Rollen, Berechtigungsrichtlinien, Benutzerzuordnungen und ACL-Risikobewertungen in NocoBase über natürliche Sprache zu verwalten – Sie beschreiben das geschäftliche Ziel, der Skill wählt Befehl und Parameter aus.


## Funktionsumfang

- Erstellen neuer Rollen
- Umschalten des globalen Rollenmodus (unabhängiger Modus / kombinierter Modus)
- Konfiguration von Aktions- und Datenbereichsberechtigungen für Datentabellen im Stapelbetrieb
- Aufheben der Zuordnung zwischen Benutzern und Rollen
- Ausgabe von Risikobewertungsberichten auf Rollen-, Benutzer- und Systemebene

## Beispiel-Prompts

### Szenario A: Benutzer im Stapel zuweisen
:::tip Voraussetzung
In der aktuellen Umgebung existiert eine Rolle "Member" sowie mehrere Benutzer.
:::

```
Bitte weise diesen neuen Benutzern die Rolle Member zu: James, Emma, Michael.
```

![Benutzer im Stapel zuweisen](https://static-docs.nocobase.com/20260422202343.png)

### Szenario B: Seitenberechtigungen im Stapel konfigurieren
:::tip Voraussetzung
In der aktuellen Umgebung existiert eine Rolle "Member" sowie mehrere Seiten.
:::
```
Bitte konfiguriere für die Rolle Member die Berechtigungen für diese Seiten: Product, Order, Stock.
```

![Seitenberechtigungen im Stapel konfigurieren](https://static-docs.nocobase.com/20260422202949.png)

### Szenario C: Berechtigungen mehrerer Datentabellen im Stapel konfigurieren
:::tip Voraussetzung
In der aktuellen Umgebung existieren eine Rolle "Member" sowie mehrere Datentabellen.
:::

```
Füge der Rolle Member für diese Datentabellen unabhängige Lesezugriffe hinzu: order, product, stock.
```

![Unabhängige Berechtigungen für Datentabellen im Stapel konfigurieren](https://static-docs.nocobase.com/20260422205341.png)

![Unabhängige Berechtigungen für Datentabellen im Stapel konfigurieren 2](https://static-docs.nocobase.com/20260422205430.png)

### Szenario D: Berechtigungskonfiguration für mehrere Rollen und Datentabellen
:::tip Voraussetzung
In der aktuellen Umgebung existieren mehrere Rollen und mehrere Datentabellen.
:::

```
Füge den Rollen Member und Sales für diese Datentabellen unabhängige Lese- und Schreibrechte hinzu: order, product, stock.
```

![Konfiguration mehrerer Rollen und Datentabellen](https://static-docs.nocobase.com/20260422213524.png)

### Szenario E: Risikobewertung

```
Bewerte das Berechtigungsrisiko der Rolle Member.
```

Es wird ein Risikoscore, eine Beschreibung des Wirkungsbereichs sowie Verbesserungsvorschläge ausgegeben.

## Häufige Fragen

**Was tun, wenn konfigurierte Berechtigungen nicht wirksam werden?**

Prüfen Sie zunächst, ob der globale Rollenmodus korrekt eingestellt ist. Wenn ein Benutzer mehrere Rollen gleichzeitig besitzt, unterscheidet sich das Verhalten zwischen kombiniertem und unabhängigem Modus erheblich. Sie können den aktuellen Modus überprüfen, um das Problem einzugrenzen.

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [NocoBase CLI](../ai/quick-start.md) – Befehlszeilen-Tool zur Installation und Verwaltung von NocoBase
