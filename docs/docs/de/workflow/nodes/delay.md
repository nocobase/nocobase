:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Verzögerung

## Einführung

Der Verzögerungs-Knoten kann einem Workflow eine Verzögerung hinzufügen. Nachdem die Verzögerung abgelaufen ist, kann der Workflow je nach Konfiguration entweder die nachfolgenden Knoten weiter ausführen oder vorzeitig beendet werden.

Er wird oft zusammen mit dem Parallelzweig-Knoten verwendet. Ein Verzögerungs-Knoten kann einem der Zweige hinzugefügt werden, um die Verarbeitung nach einem Timeout zu steuern. Stellen Sie sich zum Beispiel einen Parallelzweig vor, bei dem ein Zweig eine manuelle Bearbeitung enthält und der andere einen Verzögerungs-Knoten. Wenn die manuelle Bearbeitung ein Timeout erreicht und Sie die Einstellung „Bei Timeout fehlschlagen“ wählen, muss die manuelle Bearbeitung innerhalb der vorgegebenen Zeit abgeschlossen werden. Wenn Sie jedoch „Bei Timeout fortfahren“ einstellen, kann die manuelle Bearbeitung nach Ablauf der Zeit ignoriert werden.

## Installation

Integriertes Plugin, keine Installation erforderlich.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol („+“) im Ablauf, um einen „Verzögerung“-Knoten hinzuzufügen:

![Verzögerungs-Knoten erstellen](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Knotenkonfiguration

![Verzögerungs-Knoten_Knotenkonfiguration](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Verzögerungszeit

Für die Verzögerungszeit können Sie eine Zahl eingeben und eine Zeiteinheit auswählen. Unterstützte Zeiteinheiten sind: Sekunden, Minuten, Stunden, Tage und Wochen.

### Status bei Timeout

Für den Status bei Timeout können Sie „Erfolgreich fortfahren“ oder „Fehlschlagen und beenden“ wählen. Ersteres bedeutet, dass der Workflow nach Ablauf der Verzögerung die nachfolgenden Knoten weiter ausführt. Letzteres bedeutet, dass der Workflow nach Ablauf der Verzögerung vorzeitig mit dem Status „Fehlgeschlagen“ beendet wird.

## Beispiel

Nehmen wir das Szenario, in dem ein Arbeitsauftrag nach seiner Initiierung innerhalb einer begrenzten Zeit beantwortet werden muss. Dazu müssen wir in einem von zwei parallelen Zweigen einen manuellen Knoten und im anderen einen Verzögerungs-Knoten hinzufügen. Wird die manuelle Bearbeitung nicht innerhalb von 10 Minuten beantwortet, wird der Status des Arbeitsauftrags auf „Timeout und unbearbeitet“ aktualisiert.

![Verzögerungs-Knoten_Beispiel_Workflow-Organisation](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)