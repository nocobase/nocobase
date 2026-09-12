---
pkg: '@nocobase/plugin-version-control'
title: "Versionsverwaltung"
description: "Leitfaden für das Versionsverwaltungs-Plugin: Versionen während der Erstellung mit KI automatisch speichern, Versionen manuell erstellen und wiederherstellen, Aufbewahrung konfigurieren, Tastenkürzel setzen und Benutzer-Sammlungen einbeziehen."
keywords: "Versionsverwaltung,Version control,Betriebsmanagement,KI-Builder,nocobase-revision,nb revision create,Version erstellen,Version wiederherstellen,NocoBase"
---

# Versionsverwaltung

In NocoBase kannst du mit der **Versionsverwaltung (Version control)** eine wiederherstellbare Version der aktuellen Anwendung speichern. Du kannst Versionen manuell erstellen, bei Bedarf auf eine gespeicherte Version zurücksetzen und den KI-Builder nach sinnvollen Zwischenständen automatisch Versionen speichern lassen.

Die Versionsverwaltung nutzt [Backup-Verwaltung](../backup-manager/index.mdx), um Anwendungsstände zu speichern und wiederherzustellen. Bevor du die Versionsverwaltung verwendest, aktiviere zuerst die Backup-Verwaltung.

:::warning Hinweis

Die Community- und Standard-Editionen enthalten das Plugin für die Versionsverwaltung nicht. Wenn du einen wiederherstellbaren Anwendungsstand speichern möchtest, nutze [Backup-Verwaltung](../backup-manager/index.mdx): Erstelle vor wichtigen Änderungen manuell ein Backup und stelle bei Bedarf das entsprechende Backup wieder her.

:::

## Automatische Versionen mit KI

Nach dem Aktivieren des Versionsverwaltungs-Plugins erhält der KI-Builder eine zusätzliche Rückfallebene. Wenn ein AI Agent mit einer Anforderung beginnt, prüft er die für die aktuelle Anwendung verfügbaren NocoBase Skills. Wenn der `nocobase-revision` Skill gefunden wird, kann er wichtige Arbeitsschritte als wiederherstellbare Versionen speichern.

![KI erkennt den nocobase-revision Skill beim Start der Erstellung](https://static-docs.nocobase.com/20260611115845.png)

Wenn die KI einen eigenständig prüfbaren Abschnitt abgeschlossen hat, etwa eine Seite erstellt, mehrere Sammlungen angelegt oder einen Workflow konfiguriert hat, führt sie über die NocoBase CLI `nb revision create` aus. Du musst nicht jedes Mal manuell auf 「Create version」 klicken, und kleine Anpassungen erzeugen keine unnötig vielen Versionsdatensätze.

![KI erstellt nach der Erstellung eine Version](https://static-docs.nocobase.com/20260611115804.png)

Diese Versionen erscheinen in der Versionsliste. Wenn spätere Änderungen nicht den Erwartungen entsprechen, kannst du zum vorherigen klaren Arbeitsschritt zurückkehren und von dort aus weiter anpassen.

## Plugin öffnen

Nach dem Aktivieren des Plugins erscheint in der oberen Leiste das Menü 「Version control」. Darüber kannst du direkt eine Version erstellen oder zur Versionsliste wechseln.

Du kannst die Plugin-Seite auch über 「System settings / Version control」 öffnen. Das Standard-Tastenkürzel zum Erstellen einer Version ist `Ctrl + K` und kann im Einstellungs-Tab geändert werden.

![Version control Menü](https://static-docs.nocobase.com/20260611112317.png)

## Eine Version erstellen

Klicke auf 「Create version」, gib eine Beschreibung ein und speichere sie. Die Beschreibung kann bis zu 2000 Zeichen lang sein. Sie eignet sich gut, um den Hintergrund der Änderung festzuhalten, zum Beispiel „Felder und Berechtigungen im Genehmigungsprozess angepasst“.

![Eine Version erstellen](https://static-docs.nocobase.com/20260611112739.png)

Nach einem Klick auf Speichern erscheint in der Liste zunächst ein temporärer Eintrag mit dem Status „Saving“. Nach Abschluss wird die gespeicherte Version in der Liste angezeigt.

Wichtige Punkte:

- Der Versionsname wird automatisch generiert
- Das Erstellen über die obere Leiste, das Tastenkürzel oder die Listenseite funktioniert identisch
- Die Liste zeigt Versionsname, Beschreibung, Dateigröße, Erstellungszeit, Ersteller und verfügbare Aktionen

## Versionen verwalten und wiederherstellen

Die Versionsliste bietet hauptsächlich diese Aktionen:

- 「Refresh」 lädt die aktuelle Liste neu
- 「Delete」 löscht eine einzelne oder mehrere ausgewählte Versionen
- 「Restore」 stellt die Anwendung auf den in dieser Version gespeicherten Stand zurück

:::warning Achtung

Beim Wiederherstellen einer Version werden die aktuelle Anwendungskonfiguration und die in dieser Version enthaltenen Daten überschrieben. Es empfiehlt sich, vor der Wiederherstellung zuerst eine Version des aktuellen Stands zu erstellen.

:::

Nach einem Klick auf 「Restore」 wechselt die Anwendung für kurze Zeit in den Wartungsmodus, während die Wiederherstellung läuft. Starte in dieser Zeit keine weitere Wiederherstellung. Wenn die Wiederherstellung fehlschlägt, zeigt die Oberfläche eine Fehlermeldung an.

## Versionsregeln konfigurieren

Im Tab 「Settings」 steuerst du Aufbewahrung und Inhalt jeder Version.

![](https://static-docs.nocobase.com/20260526220720.png)

Die Einstellungen umfassen:

- `Versions to keep`: maximale Anzahl gespeicherter Versionen. Ältere Versionen werden automatisch gelöscht, sobald das Limit überschritten ist
- `Shortcut: create version`: Tastenkürzel zum Erstellen einer Version. Mit `Ctrl + Buchstabe` festlegen, mit `Backspace` löschen
- `User collections`: auswählen, welche Daten aus benutzererstellten Sammlungen in gespeicherte Versionen aufgenommen werden sollen

:::tip

Standardmäßig enthalten gespeicherte Versionen keine Daten aus benutzererstellten Sammlungen. Du musst hier nur dann Sammlungen auswählen, wenn auch Geschäftsdaten zusammen mit der Anwendungsversion wiederhergestellt werden sollen.

:::

Wenn du eine Benutzer-Sammlung einschließt, nimmt NocoBase auch verwandte Sammlungen automatisch auf, damit die Wiederherstellung in der Regel vollständiger ist.

## Verwandte Links

- [Backup-Verwaltung](../backup-manager/index.mdx) — die grundlegende Funktion, auf der die Versionsverwaltung basiert
- [Migrationsverwaltung](../migration-manager/index.md) — Anwendungskonfiguration zwischen Umgebungen verschieben
- [Release-Management](../release-management/index.md) — Veröffentlichungsabläufe mit Backups, Migrationen und Variablen planen
- [Schnellstart KI-Builder](../../ai-builder/index.md) — Datenmodellierung, Seitenkonfiguration und Workflow-Orchestrierung per natürlicher Sprache durchführen
