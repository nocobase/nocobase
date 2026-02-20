:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Geplante Aufgaben

## Einführung

Eine geplante Aufgabe ist ein Ereignis, das durch eine Zeitbedingung ausgelöst wird und in zwei Modi verfügbar ist:

- **Benutzerdefinierte Zeit:** Dies ist die reguläre, cron-ähnliche Auslösung basierend auf der Systemzeit.
- **Sammlungs-Zeitfeld:** Die Auslösung erfolgt basierend auf dem Wert eines Zeitfeldes in einer Sammlung, sobald die definierte Zeit erreicht ist.

Sobald das System den konfigurierten Zeitpunkt (sekundengenau) erreicht, der die Auslösebedingungen erfüllt, wird der entsprechende Workflow gestartet.

## Grundlegende Verwendung

### Eine geplante Aufgabe erstellen

Wählen Sie beim Erstellen eines Workflows in der Workflow-Liste den Typ „Geplante Aufgabe“ aus:

![Eine geplante Aufgabe erstellen](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Modus „Benutzerdefinierte Zeit“

Für diesen regulären Modus müssen Sie zunächst eine Startzeit (sekundengenau) festlegen. Die Startzeit kann in der Zukunft oder in der Vergangenheit liegen. Wenn Sie eine Startzeit in der Vergangenheit wählen, prüft das System anhand der konfigurierten Wiederholungsbedingung, ob die Aufgabe fällig ist. Ist keine Wiederholungsbedingung festgelegt und die Startzeit liegt in der Vergangenheit, wird der Workflow nicht mehr ausgelöst.

Es gibt zwei Möglichkeiten, die Wiederholungsregel zu konfigurieren:

- **Nach Intervall:** Die Auslösung erfolgt in einem festen Intervall nach der Startzeit, z. B. jede Stunde oder alle 30 Minuten.
- **Erweiterter Modus:** Hierbei handelt es sich um eine Konfiguration nach Cron-Regeln, bei der Sie einen Zyklus für feste, regelbasierte Datums- und Uhrzeiten festlegen können.

Nachdem Sie die Wiederholungsregel konfiguriert haben, können Sie auch eine Endbedingung festlegen. Die Aufgabe kann zu einem festen Zeitpunkt beendet oder durch eine maximale Anzahl von Ausführungen begrenzt werden.

### Modus „Sammlungs-Zeitfeld“

Die Verwendung eines Zeitfeldes einer Sammlung zur Bestimmung der Startzeit ist ein Auslösemodus, der reguläre geplante Aufgaben mit Sammlungs-Zeitfeldern kombiniert. Dieser Modus kann Knoten in bestimmten Prozessen vereinfachen und ist auch in der Konfiguration intuitiver. Wenn Sie beispielsweise überfällige, unbezahlte Bestellungen auf den Status „Storniert“ setzen möchten, können Sie einfach eine geplante Aufgabe im Modus „Sammlungs-Zeitfeld“ konfigurieren und als Startzeit „30 Minuten nach Erstellung der Bestellung“ wählen.

## Verwandte Hinweise

### Geplante Aufgaben im inaktiven oder heruntergefahrenen Zustand

Wird die konfigurierte Zeitbedingung erfüllt, der gesamte NocoBase-Anwendungsdienst befindet sich jedoch im inaktiven oder heruntergefahrenen Zustand, wird die zu diesem Zeitpunkt fällige geplante Aufgabe verpasst. Nach dem Neustart des Dienstes werden bereits verpasste Aufgaben nicht erneut ausgelöst. Daher sollten Sie bei der Verwendung entsprechende Handhabungen oder Ersatzmaßnahmen in Betracht ziehen.

### Wiederholungsanzahl

Wenn die Endbedingung „Nach Wiederholungsanzahl“ konfiguriert ist, wird die Gesamtzahl der Ausführungen über alle Versionen desselben Workflows hinweg berechnet. Wenn beispielsweise eine geplante Aufgabe in Version 1 bereits 10 Mal ausgeführt wurde und die Wiederholungsanzahl ebenfalls auf 10 festgelegt ist, wird dieser Workflow nicht mehr ausgelöst. Selbst wenn er in eine neue Version kopiert wird, erfolgt keine Auslösung, es sei denn, die Wiederholungsanzahl wird auf einen Wert größer als 10 geändert. Wird der Workflow jedoch als neuer Workflow kopiert, beginnt die Zählung der Ausführungen wieder bei 0. Ohne Änderung der relevanten Konfiguration kann der neue Workflow dann weitere 10 Mal ausgelöst werden.

### Unterschied zwischen Intervall und erweitertem Modus bei Wiederholungsregeln

Das Intervall in der Wiederholungsregel bezieht sich auf den Zeitpunkt der letzten Auslösung (oder die Startzeit), während der erweiterte Modus zu festen Zeitpunkten auslöst. Wenn Sie beispielsweise eine Auslösung alle 30 Minuten konfigurieren und die letzte Auslösung am 01.09.2021 um 12:01:23 Uhr erfolgte, ist die nächste Auslösezeit am 01.09.2021 um 12:31:23 Uhr. Der erweiterte Modus, also der Cron-Modus, ist so konfiguriert, dass er zu festen Zeitpunkten auslöst. Sie können beispielsweise festlegen, dass er zu jeder Stunde um Minute 01 und Minute 31 ausgelöst wird.

## Beispiel

Angenommen, wir müssen jede Minute Bestellungen prüfen, die nach ihrer Erstellung länger als 30 Minuten unbezahlt geblieben sind, und deren Status automatisch auf „Storniert“ ändern. Wir werden dies mit beiden Modi umsetzen.

### Modus „Benutzerdefinierte Zeit“

Erstellen Sie einen Workflow basierend auf einer geplanten Aufgabe. Wählen Sie in der Trigger-Konfiguration den Modus „Benutzerdefinierte Zeit“, legen Sie als Startzeit einen beliebigen Zeitpunkt fest, der nicht später als die aktuelle Zeit ist, wählen Sie für die Wiederholungsregel „Jede Minute“ und lassen Sie die Endbedingung leer:

![Geplante Aufgabe_Trigger-Konfiguration_Modus Benutzerdefinierte Zeit](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Konfigurieren Sie anschließend weitere Knoten gemäß der Prozesslogik, berechnen Sie die Zeit vor 30 Minuten und ändern Sie den Status unbezahlter Bestellungen, die vor diesem Zeitpunkt erstellt wurden, auf „Storniert“:

![Geplante Aufgabe_Trigger-Konfiguration_Modus Benutzerdefinierte Zeit](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Nachdem der Workflow aktiviert wurde, wird er ab der Startzeit jede Minute einmal ausgelöst. Dabei wird die Zeit vor 30 Minuten berechnet, um den Status von Bestellungen, die vor diesem Zeitpunkt erstellt wurden, auf „Storniert“ zu aktualisieren.

### Modus „Sammlungs-Zeitfeld“

Erstellen Sie einen Workflow basierend auf einer geplanten Aufgabe. Wählen Sie in der Trigger-Konfiguration den Modus „Sammlungs-Zeitfeld“, wählen Sie die Sammlung „Bestellungen“, legen Sie als Startzeit „30 Minuten nach der Erstellungszeit der Bestellung“ fest und wählen Sie für die Wiederholungsregel „Nicht wiederholen“:

![Geplante Aufgabe_Trigger-Konfiguration_Modus Sammlungs-Zeitfeld_Trigger](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Konfigurieren Sie anschließend weitere Knoten gemäß der Prozesslogik, um den Status der Bestellung mit der Trigger-Daten-ID und dem Status „Unbezahlt“ auf „Storniert“ zu aktualisieren:

![Geplante Aufgabe_Trigger-Konfiguration_Modus Sammlungs-Zeitfeld_Update-Knoten](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

Im Gegensatz zum Modus „Benutzerdefinierte Zeit“ ist hier keine Berechnung der Zeit vor 30 Minuten erforderlich, da der Trigger-Datenkontext bereits die Datenzeile enthält, die die Zeitbedingung erfüllt. Sie können den Status der entsprechenden Bestellung also direkt aktualisieren.