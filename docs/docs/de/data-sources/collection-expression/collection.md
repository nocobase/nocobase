:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Expressions-Sammlung

## Erstellen einer Expressions-Vorlagen-Sammlung

Bevor Sie dynamische Expressions-Operationsknoten innerhalb eines Workflows verwenden können, müssen Sie zuerst eine Expressions-Sammlung als Vorlage im Sammlungs-Verwaltungstool erstellen. Diese Sammlung dient als Speicherort für verschiedene Ausdrücke:

![Creating an Expression Collection](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Expressions-Daten eingeben

Danach können Sie einen Tabellenblock einrichten und mehrere Formel-Einträge in die Vorlagen-Sammlung eingeben. Jede Zeile in der Expressions-Vorlagen-Sammlung kann als Berechnungsregel für ein spezifisches Datenmodell innerhalb der Sammlung verstanden werden. Sie können Felder aus den Datenmodellen verschiedener Sammlungen als Variablen nutzen, um einzigartige Ausdrücke als Berechnungsregeln zu erstellen. Selbstverständlich können Sie auch verschiedene Berechnungs-Engines verwenden.

![Entering Expression Data](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tipp}
Nachdem die Formeln erstellt wurden, müssen sie mit den Geschäftsdaten verknüpft werden. Jede Zeile der Geschäftsdaten direkt mit den Formel-Daten zu verknüpfen, kann mühsam sein. Daher ist es üblich, eine Metadaten-Sammlung – ähnlich einer Klassifizierungs-Sammlung – zu verwenden, um eine Viele-zu-Eins- (oder Eins-zu-Eins-) Beziehung zur Formel-Sammlung herzustellen. Anschließend werden die Geschäftsdaten in einer Viele-zu-Eins-Beziehung mit den klassifizierten Metadaten verknüpft. Dieser Ansatz ermöglicht es Ihnen, beim Erstellen von Geschäftsdaten einfach die relevanten klassifizierten Metadaten anzugeben, wodurch die entsprechenden Formel-Daten über den etablierten Verknüpfungspfad leicht gefunden und genutzt werden können.
:::

## Relevante Daten in den Workflow laden

Erstellen Sie beispielsweise einen Workflow, der durch ein Sammlungs-Ereignis ausgelöst wird. Wenn ein Auftrag erstellt wird, sollte der Trigger die zugehörigen Produkt-Daten sowie die produktbezogenen Expressions-Daten vorladen:

![Collection Event_Trigger Configuration](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)