---
title: "Versionsverwaltung"
description: "Leitfaden für das Versionsverwaltungs-Plugin: Versionen erstellen, wiederherstellen, Aufbewahrung konfigurieren, Tastenkürzel setzen und Benutzer-Sammlungen einbeziehen."
keywords: "Versionsverwaltung,Version control,Betriebsmanagement,Version erstellen,Version wiederherstellen,NocoBase"
---

# Versionsverwaltung

In NocoBase kannst du mit der **Versionsverwaltung (Version control)** eine wiederherstellbare Version der aktuellen Anwendung speichern. Du kannst Versionen manuell erstellen, bei Bedarf auf eine gespeicherte Version zurücksetzen und in den Plugin-Einstellungen steuern, wie viele Versionen aufbewahrt werden, welches Tastenkürzel verwendet wird und welche Benutzer-Sammlungen mitgesichert werden.

Sie basiert auf [Backup-Verwaltung](../backup-manager/index.mdx). Wenn das Plugin für die Versionsverwaltung bereits aktiviert ist, das System aber weiterhin entsprechende Fehler anzeigt, prüfe zuerst, ob die Backup-Verwaltung aktiviert ist.

## Plugin öffnen

Du kannst das Plugin unter 「System settings」 → 「Version control」 öffnen. In der oberen Leiste erscheint außerdem eine Schaltfläche für die Versionsverwaltung. Darüber kannst du direkt eine Version erstellen oder zur Versionsliste wechseln. Das Standard-Tastenkürzel zum Erstellen einer Version ist `Ctrl + K` und kann im Einstellungs-Tab geändert werden.

![](https://static-docs.nocobase.com/20260526220402.png)

## Eine Version erstellen

Klicke auf 「Create version」, gib eine Beschreibung ein und speichere sie. Die Beschreibung kann bis zu 2000 Zeichen lang sein. Sie eignet sich gut, um den Hintergrund der Änderung festzuhalten, zum Beispiel „Felder und Berechtigungen im Genehmigungsprozess angepasst“.

![](https://static-docs.nocobase.com/20260526220510.png)

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
