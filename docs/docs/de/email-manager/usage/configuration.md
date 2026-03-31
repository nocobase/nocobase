---
pkg: "@nocobase/plugin-email-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Block-Konfiguration

## E-Mail-Nachrichten-Block

### Block hinzufügen

Auf der Konfigurationsseite klicken Sie auf die Schaltfläche **Block erstellen** und wählen den Block **E-Mail-Nachrichten (Alle)** oder **E-Mail-Nachrichten (Persönlich)** aus, um einen E-Mail-Nachrichten-Block hinzuzufügen.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Feld-Konfiguration

Klicken Sie auf die Schaltfläche **Felder** des Blocks, um die anzuzeigenden Felder auszuwählen. Detaillierte Anweisungen finden Sie in der Methode zur Feldkonfiguration für Tabellen.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Datenfilter-Konfiguration

Klicken Sie auf das Konfigurationssymbol rechts neben der Tabelle und wählen Sie **Datenbereich** aus, um den Datenbereich für die E-Mail-Filterung festzulegen.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Sie können E-Mails mit demselben Suffix über Variablen filtern:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## E-Mail-Details-Block

Aktivieren Sie zunächst die Funktion **Zum Öffnen klicken aktivieren** für ein Feld im E-Mail-Nachrichten-Block:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Fügen Sie den Block **E-Mail-Details** im Pop-up-Fenster hinzu:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Sie können den detaillierten Inhalt der E-Mail anzeigen:
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Am unteren Rand können Sie die benötigten Schaltflächen selbst konfigurieren.

## E-Mail-Sende-Block

Es gibt zwei Möglichkeiten, ein E-Mail-Sendeformular zu erstellen:

1. Fügen Sie eine Schaltfläche **E-Mail senden** oben in der Tabelle hinzu:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Fügen Sie einen **E-Mail-Sende-Block** hinzu:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Beide Methoden ermöglichen die Erstellung eines vollständigen E-Mail-Sendeformulars:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Jedes Feld im E-Mail-Formular entspricht einem regulären Formular und kann mit **Standardwerten** oder **Verknüpfungsregeln** usw. konfiguriert werden.

> Die Antwort- und Weiterleitungsformulare am unteren Rand der E-Mail-Details enthalten eine standardmäßige Datenverarbeitung, die über den **FlowEngine** geändert werden kann.