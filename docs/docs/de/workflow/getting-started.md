:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Schnellstart

## Ihren ersten Workflow konfigurieren

Navigieren Sie über das Plugin-Konfigurationsmenü in der oberen Menüleiste zur Verwaltungsseite des Workflow-Plugins:

![Einstieg in die Workflow-Plugin-Verwaltung](https://static-docs.nocobase.com/20251027222721.png)

Die Verwaltungsoberfläche zeigt alle erstellten Workflows an:

![Workflow-Verwaltung](https://static-docs.nocobase.com/20251027222900.png)

Klicken Sie auf die Schaltfläche „Neu erstellen“, um einen neuen Workflow zu erstellen, und wählen Sie „Sammlungsereignis“ aus:

![Workflow erstellen](https://static-docs.nocobase.com/20251027222951.png)

Nach dem Absenden klicken Sie in der Liste auf den Link „Konfigurieren“, um die Workflow-Konfigurationsoberfläche aufzurufen:

![Ein leerer Workflow](https://static-docs.nocobase.com/20251027223131.png)

Klicken Sie anschließend auf die Trigger-Karte, um das Konfigurationsfenster des Triggers zu öffnen. Wählen Sie eine zuvor erstellte Sammlung (z. B. die Sammlung „Artikel“) aus, wählen Sie für den Trigger-Zeitpunkt „Nach dem Hinzufügen eines Datensatzes“ und klicken Sie auf die Schaltfläche „Speichern“, um die Trigger-Konfiguration abzuschließen:

![Trigger konfigurieren](https://static-docs.nocobase.com/20251027224735.png)

Als Nächstes können Sie auf die Plus-Schaltfläche im Workflow klicken, um einen Knoten hinzuzufügen. Wählen Sie beispielsweise einen Berechnungsknoten, um das Feld „Titel“ und das Feld „ID“ aus den Trigger-Daten zu verketten:

![Berechnungsknoten hinzufügen](https://static-docs.nocobase.com/20251027224842.png)

Klicken Sie auf die Knotenkarte, um das Konfigurationsfenster des Knotens zu öffnen. Verwenden Sie die von Formula.js bereitgestellte Funktion `CONCATENATE`, um die Felder „Titel“ und „ID“ zu verketten. Die beiden Felder werden über die Variablenauswahl eingefügt:

![Berechnungsknoten mit Funktionen und Variablen](https://static-docs.nocobase.com/20251027224939.png)

Erstellen Sie anschließend einen Datensatz-Aktualisierungsknoten, um das Ergebnis im Feld „Titel“ zu speichern:

![Datensatz-Aktualisierungsknoten erstellen](https://static-docs.nocobase.com/20251027232654.png)

Klicken Sie ebenfalls auf die Karte, um das Konfigurationsfenster des Datensatz-Aktualisierungsknotens zu öffnen. Wählen Sie die Sammlung „Artikel“ aus, wählen Sie die Datensatz-ID aus dem Trigger als zu aktualisierende Datensatz-ID, wählen Sie „Titel“ als zu aktualisierendes Feld und wählen Sie das Ergebnis des Berechnungsknotens als Wert aus:

![Datensatz-Aktualisierungsknoten konfigurieren](https://static-docs.nocobase.com/20251027232802.png)

Klicken Sie abschließend in der oberen rechten Symbolleiste auf den Schalter „Aktivieren“/„Deaktivieren“, um den Workflow in den aktivierten Zustand zu versetzen, damit er ausgelöst und ausgeführt werden kann.

## Den Workflow auslösen

Kehren Sie zur Hauptoberfläche des Systems zurück, erstellen Sie einen Artikel über den Artikel-Block und geben Sie den Artikeltitel ein:

![Artikeldaten erstellen](https://static-docs.nocobase.com/20251027233004.png)

Nach dem Absenden und Aktualisieren des Blocks sehen Sie, dass der Artikeltitel automatisch in das Format „Artikeltitel + Artikel-ID“ aktualisiert wurde:

![Vom Workflow geänderter Artikeltitel](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Tipp}
Da Workflows, die durch Sammlungsereignisse ausgelöst werden, asynchron ausgeführt werden, sehen Sie die Datenaktualisierung nicht sofort in der Oberfläche, nachdem Sie die Daten übermittelt haben. Nach kurzer Zeit können Sie den aktualisierten Inhalt jedoch durch Aktualisieren der Seite oder des Blocks sehen.
:::

## Ausführungsverlauf anzeigen

Der Workflow wurde soeben erfolgreich einmal ausgelöst und ausgeführt. Sie können zur Workflow-Verwaltungsoberfläche zurückkehren, um den entsprechenden Ausführungsverlauf anzuzeigen:

![Workflow-Liste anzeigen](https://static-docs.nocobase.com/20251027233246.png)

In der Workflow-Liste sehen Sie, dass dieser Workflow einen Ausführungsverlauf generiert hat. Klicken Sie auf den Link in der Spalte „Anzahl“, um die Ausführungsverlaufseinträge für den entsprechenden Workflow zu öffnen:

![Ausführungsverlaufsliste für den entsprechenden Workflow](https://static-docs.nocobase.com/20251027233341.png)

Klicken Sie dann auf den Link „Anzeigen“, um die Detailseite dieser Ausführung aufzurufen, auf der Sie den Ausführungsstatus und die Ergebnisdaten für jeden Knoten sehen können:

![Details zum Workflow-Ausführungsverlauf](https://static-docs.nocobase.com/20251027233615.png)

Die Kontextdaten des Triggers und die Ergebnisdaten der Knotenausführung können durch Klicken auf die Status-Schaltfläche in der oberen rechten Ecke der entsprechenden Karte angezeigt werden. Betrachten wir zum Beispiel die Ergebnisdaten des Berechnungsknotens:

![Berechnungsknoten-Ergebnis](https://static-docs.nocobase.com/20251027233635.png)

Sie sehen, dass die Ergebnisdaten des Berechnungsknotens den berechneten Titel enthalten. Dieser Titel sind die Daten, die vom nachfolgenden Datensatz-Aktualisierungsknoten verwendet werden.

## Zusammenfassung

Mit den oben genannten Schritten haben wir die Konfiguration und Auslösung eines einfachen Workflows abgeschlossen und dabei folgende grundlegende Konzepte kennengelernt:

- **Workflow**: Dient zur Definition der grundlegenden Informationen eines Ablaufs, einschließlich Name, Trigger-Typ und Aktivierungsstatus. Sie können beliebig viele Knoten darin konfigurieren. Er ist die Entität, die den Ablauf trägt.
- **Trigger**: Jeder Workflow enthält einen Trigger, der mit spezifischen Bedingungen für die Auslösung des Workflows konfiguriert werden kann. Er ist der Einstiegspunkt des Ablaufs.
- **Knoten**: Ein Knoten ist eine Anweisungseinheit innerhalb eines Workflows, die eine bestimmte Aktion ausführt. Mehrere Knoten in einem Workflow bilden durch Upstream- und Downstream-Beziehungen einen vollständigen Ausführungsablauf.
- **Ausführung**: Eine Ausführung ist das spezifische Ausführungsobjekt, nachdem ein Workflow ausgelöst wurde, auch bekannt als Ausführungsdatensatz oder Ausführungsverlauf. Sie enthält Informationen wie den Ausführungsstatus und die Trigger-Kontextdaten. Für jeden Knoten gibt es auch entsprechende Ausführungsergebnisse, die den Status und die Ergebnisdaten des Knotens nach der Ausführung enthalten.

Für eine tiefergehende Nutzung können Sie sich auf die folgenden Inhalte beziehen:

- [Trigger](./triggers/index)
- [Knoten](./nodes/index)
- [Variablen verwenden](./advanced/variables)
- [Ausführungen](./advanced/executions)
- [Versionsverwaltung](./advanced/revisions)
- [Erweiterte Optionen](./advanced/options)