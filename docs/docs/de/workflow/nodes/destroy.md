:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Daten löschen

Mit diesem Knoten können Sie Daten aus einer Sammlung löschen, die bestimmte Bedingungen erfüllen. Die grundlegende Funktionsweise des Löschen-Knotens ist ähnlich wie die des Aktualisieren-Knotens. Der Löschen-Knoten benötigt jedoch keine Feldzuweisung. Sie müssen lediglich die Sammlung und die Filterbedingungen auswählen. Das Ergebnis des Löschen-Knotens ist die Anzahl der erfolgreich gelöschten Zeilen. Diese Information ist nur im Ausführungsverlauf sichtbar und kann nicht als Variable in nachfolgenden Knoten verwendet werden.

:::info{title=Hinweis}
Der Löschen-Knoten unterstützt derzeit kein Löschen Zeile für Zeile; er führt stattdessen Massenlöschungen durch. Daher werden keine weiteren Ereignisse für jede einzelne gelöschte Dateneinheit ausgelöst.
:::

## Knoten erstellen

In der Workflow-Konfigurationsoberfläche klicken Sie auf das Plus-Symbol („+“) im Workflow, um einen „Daten löschen“-Knoten hinzuzufügen:

![Löschen-Knoten erstellen](https://static-docs.nocobase.com/e13b6b728251fcdbed6c7f50e5570da2.png)

## Knotenkonfiguration

![Löschen-Knoten_Knotenkonfiguration](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Sammlung

Wählen Sie die Sammlung aus, aus der Daten gelöscht werden sollen.

### Filterbedingungen

Ähnlich wie bei den Filterbedingungen für eine reguläre Abfrage einer Sammlung können Sie die Kontextvariablen des Workflows verwenden.

## Beispiel

Um beispielsweise stornierte und ungültige historische Bestelldaten regelmäßig zu bereinigen, können Sie den Löschen-Knoten verwenden:

![Löschen-Knoten_Beispiel_Knotenkonfiguration](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Der Workflow wird regelmäßig ausgelöst und führt die Löschung aller stornierten und ungültigen historischen Bestelldaten aus.