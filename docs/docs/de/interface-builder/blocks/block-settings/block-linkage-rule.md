:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Block-Verknüpfungsregeln

## Einführung

Block-Verknüpfungsregeln ermöglichen es Benutzern, die Anzeige von Blöcken dynamisch zu steuern und die Darstellung von Elementen auf Blockebene zu verwalten. Da Blöcke als Container für Felder und Aktionsschaltflächen dienen, können Benutzer mit diesen Regeln die Anzeige der gesamten Ansicht flexibel auf Blockebene steuern.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Hinweis**: Bevor Block-Verknüpfungsregeln ausgeführt werden, muss die Anzeige eines Blocks zunächst eine **ACL-Berechtigungsprüfung** durchlaufen. Nur wenn ein Benutzer die entsprechenden Zugriffsrechte besitzt, wird die Logik der Block-Verknüpfungsregeln ausgewertet. Das bedeutet, Block-Verknüpfungsregeln treten erst in Kraft, nachdem die ACL-Anzeigeberechtigungen erfüllt sind. Sind keine Block-Verknüpfungsregeln vorhanden, wird der Block standardmäßig angezeigt.

### Blöcke mit globalen Variablen steuern

**Block-Verknüpfungsregeln** unterstützen die Verwendung globaler Variablen, um den in Blöcken angezeigten Inhalt dynamisch zu steuern. So können Benutzer mit unterschiedlichen Rollen und Berechtigungen maßgeschneiderte Datenansichten sehen und mit ihnen interagieren. In einem Auftragsverwaltungssystem haben beispielsweise verschiedene Rollen (wie Administratoren, Vertriebsmitarbeiter und Finanzpersonal) zwar alle die Berechtigung, Aufträge anzuzeigen, aber die Felder und Aktionsschaltflächen, die jede Rolle sehen muss, können unterschiedlich sein. Durch die Konfiguration globaler Variablen können Sie die angezeigten Felder, Aktionsschaltflächen und sogar die Sortier- und Filterregeln für Daten flexibel an die Rolle, Berechtigungen oder andere Bedingungen des Benutzers anpassen.

#### Spezifische Anwendungsfälle:

- **Rollen- und Berechtigungssteuerung**: Steuern Sie die Sichtbarkeit oder Bearbeitbarkeit bestimmter Felder basierend auf den Berechtigungen verschiedener Rollen. Vertriebsmitarbeiter können beispielsweise nur grundlegende Auftragsinformationen anzeigen, während Finanzmitarbeiter die Zahlungsdetails einsehen können.
- **Personalisierte Ansichten**: Passen Sie unterschiedliche Block-Ansichten für verschiedene Abteilungen oder Teams an. So stellen Sie sicher, dass jeder Benutzer nur Inhalte sieht, die für seine Arbeit relevant sind, und steigern die Effizienz.
- **Verwaltung von Aktionsberechtigungen**: Steuern Sie die Anzeige von Aktionsschaltflächen mithilfe globaler Variablen. Einige Rollen können beispielsweise nur Daten anzeigen, während andere Rollen Aktionen wie Ändern oder Löschen ausführen können.

### Blöcke mit Kontextvariablen steuern

Blöcke können auch durch Variablen im Kontext gesteuert werden. Sie können beispielsweise Kontextvariablen wie „Aktueller Datensatz“, „Aktuelles Formular“ und „Aktueller Popup-Datensatz“ verwenden, um Blöcke dynamisch anzuzeigen oder auszublenden.

Beispiel: Der Block „Auftrags-Chanceninformationen“ wird nur angezeigt, wenn der Auftragsstatus „Bezahlt“ ist.

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Weitere Informationen zu Verknüpfungsregeln finden Sie unter [Verknüpfungsregeln](/interface-builder/linkage-rule).