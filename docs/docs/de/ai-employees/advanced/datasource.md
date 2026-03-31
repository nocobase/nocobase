---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Erweitert

## Einführung

Im AI Mitarbeiter Plugin können Sie Datenquellen konfigurieren und Sammlungsabfragen voreinstellen. Diese werden dann als Anwendungskontext gesendet, wenn Sie mit dem AI Mitarbeiter sprechen. Der AI Mitarbeiter antwortet basierend auf den Ergebnissen dieser Sammlungsabfragen.

## Datenquellen-Konfiguration

Gehen Sie zur Konfigurationsseite des AI Mitarbeiter Plugins und klicken Sie auf den Tab `Data source`, um zur Verwaltungsseite der AI Mitarbeiter Datenquellen zu gelangen.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Klicken Sie auf die Schaltfläche `Add data source`, um die Seite zur Erstellung einer Datenquelle aufzurufen.

Schritt 1: Geben Sie die grundlegenden Informationen zur Sammlung ein:
- Geben Sie im Eingabefeld `Title` einen leicht merkbaren Namen für die Datenquelle ein;
- Wählen Sie im Eingabefeld `Collection` die zu verwendende Datenquelle und Sammlung aus;
- Geben Sie im Eingabefeld `Description` eine Beschreibung für die Datenquelle ein.
- Geben Sie im Eingabefeld `Limit` das Abfragelimit für die Datenquelle ein, um zu vermeiden, dass zu viele Daten zurückgegeben werden, die den AI-Konversationskontext überschreiten.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Schritt 2: Wählen Sie die abzufragenden Felder aus:

Markieren Sie in der Liste `Fields` die Felder, die Sie abfragen möchten.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Schritt 3: Legen Sie die Abfragebedingungen fest:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Schritt 4: Legen Sie die Sortierbedingungen fest:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Bevor Sie die Datenquelle speichern, können Sie abschließend die Abfrageergebnisse der Datenquelle in der Vorschau anzeigen.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Datenquellen in Konversationen senden

Im Dialogfeld des AI Mitarbeiters klicken Sie unten links auf die Schaltfläche `Add work context`, wählen `Data source` aus, und Sie sehen die soeben hinzugefügte Datenquelle.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Markieren Sie die Datenquelle, die Sie senden möchten. Die ausgewählte Datenquelle wird dann dem Dialogfeld hinzugefügt.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Nachdem Sie Ihre Frage eingegeben haben, klicken Sie wie beim Senden einer normalen Nachricht auf die Schaltfläche zum Senden, und der AI Mitarbeiter wird basierend auf der Datenquelle antworten.

Die Datenquelle wird auch in der Nachrichtenliste angezeigt.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Hinweise

Die Datenquelle filtert Daten automatisch basierend auf den ACL-Berechtigungen des aktuellen Benutzers, sodass nur die Daten angezeigt werden, auf die der Benutzer Zugriff hat.