---
pkg: '@nocobase/plugin-acl'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Berechtigungen konfigurieren

## Allgemeine Berechtigungseinstellungen

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Konfigurationsberechtigungen

1.  **Benutzeroberfläche konfigurieren**: Diese Berechtigung steuert, ob Benutzer die Benutzeroberfläche anpassen dürfen. Nach der Aktivierung erscheint ein Button zur UI-Konfiguration. Für die Rolle "admin" ist diese Berechtigung standardmäßig aktiviert.
2.  **Plugins installieren, aktivieren, deaktivieren**: Diese Berechtigung legt fest, ob Benutzer Plugins aktivieren oder deaktivieren dürfen. Ist sie aktiv, erhalten Benutzer Zugriff auf die Plugin-Manager-Oberfläche. Für die Rolle "admin" ist diese Berechtigung standardmäßig aktiviert.
3.  **Plugins konfigurieren**: Diese Berechtigung erlaubt Benutzern, Plugin-Parameter zu konfigurieren oder Backend-Daten von Plugins zu verwalten. Für die Rolle "admin" ist diese Berechtigung standardmäßig aktiviert.
4.  **Cache leeren, Anwendung neu starten**: Diese Berechtigung bezieht sich auf Systemwartungsaufgaben wie das Leeren des Caches und das Neustarten der Anwendung. Nach der Aktivierung erscheinen die entsprechenden Schaltflächen im persönlichen Bereich. Diese Berechtigung ist standardmäßig deaktiviert.
5.  **Neue Menüpunkte standardmäßig zugänglich**: Neu erstellte Menüs sind standardmäßig zugänglich, und diese Einstellung ist standardmäßig aktiviert.

### Globale Aktionsberechtigungen

Globale Aktionsberechtigungen gelten universell für alle Sammlungen und sind nach Operationstyp kategorisiert. Sie können basierend auf dem Datenbereich konfiguriert werden: *Alle Daten* oder *Eigene Daten*. Mit der Option *Alle Daten* können Operationen auf der gesamten Sammlung ausgeführt werden, während *Eigene Daten* die Operationen auf die Daten beschränkt, die für den Benutzer relevant sind.

## Sammlungs-Aktionsberechtigungen

![](https://static-docs.nocobase.com/6a6e02817391cecdea5b218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Sammlungs-Aktionsberechtigungen verfeinern die globalen Aktionsberechtigungen und ermöglichen eine individuelle Konfiguration des Ressourcenzugriffs innerhalb jeder Sammlung. Diese Berechtigungen sind in zwei Aspekte unterteilt:

1.  **Aktionsberechtigungen**: Dazu gehören Operationen wie Hinzufügen, Anzeigen, Bearbeiten, Löschen, Exportieren und Importieren. Diese Berechtigungen werden basierend auf dem Datenbereich konfiguriert:
    -   **Alle Daten**: Ermöglicht Benutzern, Operationen für alle Datensätze innerhalb der Sammlung auszuführen.
    -   **Eigene Daten**: Beschränkt Benutzer darauf, Operationen nur für Datensätze auszuführen, die sie selbst erstellt haben.

2.  **Feld-Berechtigungen**: Feld-Berechtigungen ermöglichen es Ihnen, spezifische Berechtigungen für jedes Feld bei verschiedenen Operationen festzulegen. Zum Beispiel können bestimmte Felder so konfiguriert werden, dass sie nur angezeigt, aber nicht bearbeitet werden dürfen.

## Menü-Zugriffsberechtigungen

Menü-Zugriffsberechtigungen steuern den Zugriff basierend auf den Menüpunkten.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Plugin-Konfigurationsberechtigungen

Plugin-Konfigurationsberechtigungen steuern die Möglichkeit, spezifische Plugin-Parameter zu konfigurieren. Wenn diese Berechtigung aktiviert ist, erscheint die entsprechende Plugin-Verwaltungsoberfläche im Admin-Center.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)