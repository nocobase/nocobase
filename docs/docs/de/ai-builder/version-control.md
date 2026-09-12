---
title: "Versionsverwaltung"
description: "Der Skill Versionsverwaltung (nocobase-revision) erstellt wiederherstellbare Anwendungsversionen, nachdem AI Builder Meilensteine abgeschlossen hat."
keywords: "AI Builder,Versionsverwaltung,nocobase-revision,nb revision create,Version wiederherstellen"
---

# Versionsverwaltung

:::tip Voraussetzungen

- Installieren Sie vor dem Lesen dieser Seite die NocoBase CLI und schließen Sie die Initialisierung gemäß [AI Builder Schnellstart](./index.md) ab
- Aktivieren Sie die Plugins „Backup Management“ und „Version Control“
- Community- und Standard-Editionen enthalten das Plugin Version Control nicht. Wenn Sie vor wichtigen Änderungen nur einen Rückkehrpunkt benötigen, verwenden Sie [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Einführung

Der Skill Versionsverwaltung (`nocobase-revision`) erstellt eine wiederherstellbare Anwendungsversion, nachdem AI Builder einen sinnvollen Meilenstein abgeschlossen hat. Zum Beispiel kann die KI nach dem Aufbau einer Seite, dem Erstellen mehrerer Collections oder dem Konfigurieren eines Workflows mit `nb revision create` den aktuellen Zustand speichern.

Er erstellt nicht nach jeder Feldänderung eine Version. Standardmäßig wird erst gespeichert, wenn ein klarer Meilenstein abgeschlossen und überprüft wurde. So bleibt die Versionsliste lesbar und Rückkehrpunkte sind leichter zu wählen.

Informationen zur Versionsliste, manuellen Erstellung, Wiederherstellung und Aufbewahrungsstrategie finden Sie im [Handbuch zum Plugin Version Control](../ops-management/version-control/index.md).

## Funktionsumfang

Kann:

- Nach einem abgeschlossenen und überprüften Aufbau-Meilenstein eine Version erstellen
- Eine kurze Beschreibung schreiben, die erklärt, was gespeichert wurde
- Versionen mit der aktuellen CLI-Umgebung erstellen

Kann nicht:

- Die zugrunde liegenden Speicher- und Wiederherstellungsfunktionen des Backup-Management-Plugins ersetzen
- Versionen erstellen, wenn das Plugin Version Control nicht aktiviert ist
- Automatisch zu einer Version wiederherstellen. Verwenden Sie dafür das [Plugin Version Control](../ops-management/version-control/index.md)

## Prompt-Beispiele

### Szenario A: Fertige Seitenkonfiguration speichern

```text
Speichere den aktuellen Aufbau als Version: Kundenverwaltungsseite, Filterbereich und Bearbeitungsformular sind fertig konfiguriert
```

Der Skill formuliert daraus eine kurze Versionsbeschreibung und erstellt eine Version.

Befehlsmodus:

```bash
nb revision create "Kundenverwaltungsseite, Filterbereich und Bearbeitungsformular fertig konfiguriert"
```

### Szenario B: Datenmodell und Workflow speichern

```text
Die Lieferanten-Collections und der Einkaufsfreigabe-Workflow sind verifiziert. Bitte erstelle eine Version.
```

Das passt zu Arbeiten, die mehrere Fähigkeiten kombinieren. Zum Beispiel Collections mit [Datenmodellierung](./data-modeling) erstellen, einen Freigabeprozess mit [Workflow-Verwaltung](./workflow) konfigurieren, das Ergebnis prüfen und danach eine Version speichern.

### Szenario C: Version in einer bestimmten Umgebung erstellen

```text
Speichere in der dev-Umgebung eine Version: Ticketverwaltungsseite und SLA-Felder sind fertig konfiguriert
```

Wenn die angegebene Umgebung nicht die aktuelle CLI-Umgebung ist, bestätigt der Skill zuerst das Ziel, damit die Version nicht in der falschen Anwendung gespeichert wird.

Befehlsmodus:

```bash
nb revision create --env dev --yes "Ticketverwaltungsseite und SLA-Felder fertig konfiguriert"
```

## Versionsbeschreibungen schreiben

Eine Versionsbeschreibung sollte sagen, was abgeschlossen wurde, nicht nur ein ungenaues Etikett verwenden.

Empfohlen:

- `Kundenstammdaten, Detailseite und Freigabeprozess fertig konfiguriert`
- `Lieferanten-Collections, Einkaufsformular und Freigabe-Workflow fertiggestellt`
- `Completed customer detail page, edit form, and submission workflow wiring`

Nicht empfohlen:

- `snapshot`
- `backup`
- `test`
- `version 2`
- Nur Datum oder Zeitstempel

Schreiben Sie außerdem keine Tokens, URLs, Passwörter oder andere vertrauliche Informationen in die Beschreibung. Die Beschreibung erscheint in der Versionsliste und sollte klar, lesbar und nachvollziehbar bleiben.

## FAQ

**Wann sollte ich eine Version erstellen?**

Nach einem Meilenstein, der eigenständig geprüft werden kann. Zum Beispiel wenn eine Seite geöffnet und bearbeitet werden kann, Collection-Beziehungen überprüft wurden oder ein Workflow gespeichert und seine Node-Kette kontrolliert wurde.

**Warum nicht nach jeder KI-Anpassung eine Version erstellen?**

Zu viele kleine Versionen machen die Liste schnell unübersichtlich. Eine Version sollte normalerweise einen Punkt markieren, zu dem Sie zurückkehren und weiterarbeiten können, nicht nur eine einzelne Feldumbenennung oder Button-Verschiebung.

**Muss das Ergebnis vor dem Erstellen geprüft werden?**

Ja. Der Skill Versionsverwaltung ist für abgeschlossene und überprüfte Ergebnisse gedacht. Wenn eine Seite noch Fehler zeigt oder ein Workflow nicht bestätigt ist, lassen Sie die KI zuerst korrigieren und prüfen.

**Wo stelle ich eine Version wieder her?**

In der Versionsliste des Plugins Version Control. Die Wiederherstellung überschreibt die aktuelle Anwendungskonfiguration und die in dieser Version enthaltenen Daten. Lesen Sie vor der Bedienung das [Handbuch zum Plugin Version Control](../ops-management/version-control/index.md).

## Verwandte Links

- [Handbuch zum Plugin Version Control](../ops-management/version-control/index.md) — Versionen manuell erstellen, wiederherstellen und Regeln konfigurieren
- [Backup Management](../ops-management/backup-manager/index.mdx) — zugrunde liegende Fähigkeit für Version Control
- [AI Builder Übersicht](./index.md) — Übersicht und Installation aller AI-Builder-Skills
- [Release-Verwaltung](./publish.md) — umgebungsübergreifende Veröffentlichung, Sicherung, Wiederherstellung und Migration
