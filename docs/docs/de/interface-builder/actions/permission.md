:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Zugriffsrechte

## Einführung

In NocoBase 2.0 werden Zugriffsrechte derzeit hauptsächlich über die Ressourcenrechte von Sammlungen gesteuert:

- **Ressourcenrechte für Sammlungen**: Diese dienen dazu, die grundlegenden Zugriffsrechte verschiedener Rollen für eine Sammlung (wie Erstellen (Create), Anzeigen (View), Bearbeiten (Update) und Löschen (Delete)) einheitlich zu steuern. Dieses Recht gilt für die gesamte Sammlung unterhalb der Datenquelle und stellt sicher, dass die entsprechenden Zugriffsrechte einer Rolle für diese Sammlung auf verschiedenen Seiten, in Pop-ups und Blöcken konsistent bleiben.

### Ressourcenrechte für Sammlungen

Im NocoBase Berechtigungssystem werden die Zugriffsrechte für Sammlungen grundsätzlich nach CRUD-Dimensionen unterteilt, um Konsistenz und Standardisierung in der Berechtigungsverwaltung zu gewährleisten. Zum Beispiel:

- **Erstellungsrechte (Create)**: Steuern alle mit dem Erstellen verbundenen Aktionen für die Sammlung, einschließlich Hinzufügen, Duplizieren usw. Solange eine Rolle die Erstellungsrechte für diese Sammlung besitzt, sind die Aktionen zum Hinzufügen, Duplizieren und andere erstellungsbezogene Aktionen auf allen Seiten und in allen Pop-ups sichtbar.
- **Löschrechte (Delete)**: Steuern die Löschaktion für diese Sammlung. Die Berechtigung bleibt konsistent, unabhängig davon, ob es sich um eine Massenlöschaktion in einem Tabellenblock oder eine Löschaktion für einen einzelnen Datensatz in einem Detailblock handelt.
- **Bearbeitungsrechte (Update)**: Steuern Aktionen vom Typ 'Aktualisieren' für diese Sammlung, wie Bearbeitungsaktionen und Aktualisierungsaktionen für Datensätze.
- **Anzeigerechte (View)**: Steuern die Datensichtbarkeit dieser Sammlung. Zugehörige Datenblöcke (Tabelle, Liste, Details usw.) sind nur sichtbar, wenn die Rolle Anzeigerechte für diese Sammlung besitzt.

Diese universelle Methode zur Berechtigungsverwaltung eignet sich für die standardisierte Datenberechtigungssteuerung und stellt sicher, dass für die `gleiche Sammlung` die `gleiche Aktion` `konsistente` Berechtigungsregeln über `verschiedene Seiten, Pop-ups und Blöcke` hinweg besitzt, was Einheitlichkeit und Wartbarkeit gewährleistet.

#### Globale Berechtigungen

Globale Zugriffsrechte gelten für alle Sammlungen unterhalb der Datenquelle und sind nach Ressourcentyp wie folgt kategorisiert:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Spezifische Zugriffsrechte für Sammlungen

Spezifische Zugriffsrechte für Sammlungen überschreiben die allgemeinen Berechtigungen der Datenquelle, verfeinern die Zugriffsrechte weiter und ermöglichen benutzerdefinierte Berechtigungskonfigurationen für den Zugriff auf Ressourcen einer spezifischen Sammlung. Diese Berechtigungen sind in zwei Aspekte unterteilt:

1.  Aktionsrechte: Aktionsrechte umfassen Aktionen zum Hinzufügen, Anzeigen, Bearbeiten, Löschen, Exportieren und Importieren. Diese Berechtigungen werden basierend auf der Dimension des Datenumfangs konfiguriert:
    -   Alle Datensätze: Ermöglicht Benutzern, Aktionen für alle Datensätze in der Sammlung auszuführen.
    -   Eigene Datensätze: Beschränkt Benutzer darauf, Aktionen nur für die von ihnen erstellten Datensätze auszuführen.

2.  Feldrechte: Feldrechte ermöglichen die Konfiguration von Berechtigungen für jedes Feld in verschiedenen Aktionen. Zum Beispiel können einige Felder so konfiguriert werden, dass sie nur angezeigt, aber nicht bearbeitet werden können.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Verwandte Dokumentation

[Berechtigungen konfigurieren]