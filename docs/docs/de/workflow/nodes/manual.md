---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Manuelle Bearbeitung

## Einführung

Wenn Geschäftsprozesse nicht vollständig automatisiert werden können, um Entscheidungen zu treffen, können Sie über einen manuellen Knoten einen Teil der Entscheidungsbefugnis an eine Person delegieren.

Wenn ein manueller Knoten ausgeführt wird, unterbricht er zunächst die Ausführung des gesamten Workflows und erstellt eine entsprechende Aufgabe für den zuständigen Benutzer. Nachdem der Benutzer die Aufgabe eingereicht hat, wird basierend auf dem ausgewählten Status entschieden, ob der Workflow fortgesetzt, pausiert oder beendet wird. Dies ist besonders nützlich in Szenarien wie Genehmigungsprozessen.

## Installation

Dies ist ein integriertes Plugin, das keine Installation erfordert.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol („+“) im Workflow, um einen „Manuellen Bearbeitungs“-Knoten hinzuzufügen:

![Manuellen Knoten erstellen](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Knoten konfigurieren

### Bearbeiter

Ein manueller Knoten erfordert die Zuweisung eines Benutzers als Bearbeiter der Aufgabe. Die Liste der Aufgaben kann als Block auf einer Seite hinzugefügt werden, und der Inhalt des Aufgaben-Pop-ups für jeden Knoten muss in der Benutzeroberfläche des Knotens konfiguriert werden.

Wählen Sie einen Benutzer aus oder wählen Sie über eine Variable den Primär- oder Fremdschlüssel von Benutzerdaten aus dem Kontext.

![Manueller Knoten_Konfiguration_Bearbeiter_Variable auswählen](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Hinweis}
Derzeit unterstützt die Option „Bearbeiter“ für manuelle Knoten keine Bearbeitung durch mehrere Benutzer. Dies wird in zukünftigen Versionen unterstützt.
:::

### Benutzeroberfläche konfigurieren

Die Konfiguration der Benutzeroberfläche für Aufgaben ist der Kern des manuellen Knotens. Sie können auf die Schaltfläche „Benutzeroberfläche konfigurieren“ klicken, um ein separates Konfigurations-Pop-up zu öffnen. Dieses kann, genau wie eine normale Seite, im WYSIWYG-Verfahren konfiguriert werden:

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Registerkarten

Registerkarten können verwendet werden, um verschiedene Inhalte zu unterscheiden. Beispielsweise kann eine Registerkarte für die Übermittlung eines genehmigten Formulars, eine andere für die Übermittlung eines abgelehnten Formulars oder zur Anzeige von Details zugehöriger Daten dienen. Sie sind frei konfigurierbar.

#### Blöcke

Die unterstützten Blocktypen lassen sich hauptsächlich in zwei Kategorien unterteilen: Datenblöcke und Formularblöcke. Markdown wird hauptsächlich für statische Inhalte wie Hinweismeldungen verwendet.

##### Datenblock

Datenblöcke können Trigger-Daten oder die Verarbeitungsergebnisse beliebiger Knoten anzeigen, um dem Bearbeiter der Aufgabe relevante Kontextinformationen bereitzustellen. Wenn der Workflow beispielsweise durch ein Formularereignis ausgelöst wird, können Sie einen Detailblock für die Trigger-Daten erstellen. Dies entspricht der Detailkonfiguration einer normalen Seite und ermöglicht es Ihnen, beliebige Felder aus den Trigger-Daten zur Anzeige auszuwählen:

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration_Datenblock_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Knoten-Datenblöcke funktionieren ähnlich; Sie können das Datenergebnis eines vorgelagerten Knotens als Detailanzeige auswählen. Zum Beispiel kann das Ergebnis eines vorgelagerten Berechnungs-Knotens als Kontextreferenzinformation für die Aufgabe des Bearbeiters dienen:

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration_Datenblock_Knotendaten](https://static-docs.nocobase.com/a583e26e508e9544b310a72c2d0a404c.png)

:::info{title=Hinweis}
Da sich der Workflow während der Oberflächenkonfiguration in einem nicht ausgeführten Zustand befindet, werden in den Datenblöcken keine spezifischen Daten angezeigt. Die relevanten Daten für eine bestimmte Workflow-Instanz sind erst im Aufgaben-Pop-up sichtbar, nachdem der Workflow ausgelöst und ausgeführt wurde.
:::

##### Formularblock

In der Aufgabenoberfläche muss mindestens ein Formularblock konfiguriert werden, um die endgültige Entscheidung über die Fortsetzung des Workflows zu treffen. Wenn kein Formular konfiguriert wird, kann der Workflow nach einer Unterbrechung nicht fortgesetzt werden. Es gibt drei Arten von Formularblöcken:

- Benutzerdefiniertes Formular
- Formular zum Erstellen von Datensätzen
- Formular zum Aktualisieren von Datensätzen

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration_Formulartypen](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Formulare zum Erstellen und Aktualisieren von Datensätzen erfordern die Auswahl einer zugrunde liegenden Sammlung. Nachdem der Bearbeiter das Formular eingereicht hat, werden die Werte im Formular verwendet, um Daten in der angegebenen Sammlung zu erstellen oder zu aktualisieren. Ein benutzerdefiniertes Formular ermöglicht es Ihnen, ein temporäres Formular frei zu definieren, das nicht an eine Sammlung gebunden ist. Die vom Bearbeiter übermittelten Feldwerte können in nachfolgenden Knoten verwendet werden.

Die Schaltflächen zum Absenden des Formulars können in drei Typen konfiguriert werden:

- Absenden und Workflow fortsetzen
- Absenden und Workflow beenden
- Nur Formularwerte speichern

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration_Formularschaltflächen](https://static-docs.nocobase.com/6b45995b14112e85a821dff6f6e3189a.png)

Die drei Schaltflächen repräsentieren drei Knotenstatus im Workflow-Prozess. Nach dem Absenden ändert sich der Status des Knotens entweder zu „Abgeschlossen“, „Abgelehnt“ oder verbleibt im Status „Wartend“. Ein Formular muss mindestens eine der ersten beiden Optionen konfiguriert haben, um den weiteren Verlauf des gesamten Workflows zu bestimmen.

Auf der Schaltfläche „Workflow fortsetzen“ können Sie Zuweisungen für Formularfelder konfigurieren:

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration_Formularschaltfläche_Formularwerte festlegen](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Manueller Knoten_Knotenkonfiguration_Oberflächenkonfiguration_Formularschaltfläche_Pop-up Formularwerte festlegen](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Nach dem Öffnen des Pop-ups können Sie beliebigen Formularfeldern Werte zuweisen. Nach dem Absenden des Formulars wird dieser Wert als endgültiger Wert des Feldes verwendet. Dies ist besonders nützlich bei der Überprüfung von Daten. Sie können in einem Formular mehrere verschiedene Schaltflächen „Workflow fortsetzen“ verwenden, wobei jede Schaltfläche unterschiedliche Aufzählungswerte für Felder wie den Status festlegt, um so die Fortsetzung der nachfolgenden Workflow-Ausführung mit unterschiedlichen Datenwerten zu erreichen.

## Aufgabenblock

Für die manuelle Bearbeitung müssen Sie außerdem eine Aufgabenliste auf einer Seite hinzufügen, um die ausstehenden Aufgaben anzuzeigen. So können die zuständigen Mitarbeiter über diese Liste auf die spezifischen Aufgaben des manuellen Knotens zugreifen und diese bearbeiten.

### Block hinzufügen

Sie können aus den Blöcken auf einer Seite „Workflow-Aufgaben“ auswählen, um einen Aufgabenlisten-Block hinzuzufügen:

![Manueller Knoten_Aufgabenblock hinzufügen](https://static-docs.nocobase.com/198b417454cd73b704267bf30fe5e647.png)

Beispiel für einen Aufgabenlisten-Block:

![Manueller Knoten_Aufgabenliste](https://static-docs.nocobase.com/cfefb0d6b220f34.png)

### Aufgabendetails

Danach können die zuständigen Mitarbeiter auf die entsprechende Aufgabe klicken, um das Aufgaben-Pop-up zu öffnen und die manuelle Bearbeitung durchzuführen:

![Manueller Knoten_Aufgabendetails](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Beispiel

### Beitragsprüfung

Angenommen, ein von einem normalen Benutzer eingereichter Beitrag muss von einem Administrator genehmigt werden, bevor er in den Status „Veröffentlicht“ geändert werden kann. Wird der Workflow abgelehnt, verbleibt der Beitrag im Status „Entwurf“ (nicht öffentlich). Dieser Prozess lässt sich mithilfe eines Aktualisierungsformulars in einem manuellen Knoten umsetzen.

Erstellen Sie einen Workflow, der durch „Beitrag erstellen“ ausgelöst wird, und fügen Sie einen manuellen Knoten hinzu:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Workflow-Orchestrierung" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Konfigurieren Sie im manuellen Knoten den Bearbeiter als Administrator. Fügen Sie in der Oberflächenkonfiguration einen Block basierend auf den Trigger-Daten hinzu, um die Details des neuen Beitrags anzuzeigen:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Knotenkonfiguration_Detailblock" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Fügen Sie in der Konfigurationsoberfläche einen Block basierend auf einem Formular zum Aktualisieren von Datensätzen hinzu und wählen Sie die Beitragssammlung aus. Dies dient dazu, dass der Administrator entscheidet, ob die Prüfung genehmigt wird. Nach der Genehmigung wird der entsprechende Beitrag basierend auf weiteren nachfolgenden Konfigurationen aktualisiert. Nach dem Hinzufügen des Formulars gibt es standardmäßig eine Schaltfläche „Workflow fortsetzen“, die als „Genehmigen“ betrachtet werden kann. Fügen Sie dann eine Schaltfläche „Workflow beenden“ hinzu, die für den Fall einer Ablehnung verwendet wird:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Knotenkonfiguration_Formular und Aktionen" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Wenn der Workflow fortgesetzt wird, müssen wir den Status des Beitrags aktualisieren. Hierfür gibt es zwei Konfigurationsmöglichkeiten. Eine besteht darin, das Statusfeld des Beitrags direkt im Formular zur Auswahl durch den Bearbeiter anzuzeigen. Diese Methode eignet sich besser für Situationen, die eine aktive Formularausfüllung erfordern, wie zum Beispiel die Abgabe von Feedback:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Knotenkonfiguration_Formularfelder" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Um die Aufgabe des Bearbeiters zu vereinfachen, besteht eine andere Möglichkeit darin, die Zuweisung von Formularwerten auf der Schaltfläche „Workflow fortsetzen“ zu konfigurieren. Fügen Sie in der Zuweisung ein Feld „Status“ mit dem Wert „Veröffentlicht“ hinzu. Dies bedeutet, dass der Beitrag, wenn der Bearbeiter auf die Schaltfläche klickt, in den Status „Veröffentlicht“ aktualisiert wird:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Knotenkonfiguration_Formularzuweisung" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Wählen Sie dann aus dem Konfigurationsmenü in der oberen rechten Ecke des Formularblocks die Filterbedingung für die zu aktualisierenden Daten aus. Hier wählen Sie die Sammlung „Beiträge“ und die Filterbedingung lautet „ID `gleich` Trigger-Variable / Trigger-Daten / ID“:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Knotenkonfiguration_Formularbedingung" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Schließlich können Sie die Titel der einzelnen Blöcke, den Text der zugehörigen Schaltflächen sowie den Hinweistext der Formularfelder anpassen, um die Benutzeroberfläche benutzerfreundlicher zu gestalten:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Knotenkonfiguration_Endgültiges Formular" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Schließen Sie das Konfigurationspanel und klicken Sie auf die Schaltfläche „Absenden“, um die Knotenkonfiguration zu speichern. Der Workflow ist nun konfiguriert. Nachdem dieser Workflow aktiviert wurde, wird er automatisch ausgelöst, wenn ein neuer Beitrag erstellt wird. Der Administrator kann in der Aufgabenliste sehen, dass dieser Workflow bearbeitet werden muss. Durch Klicken auf „Anzeigen“ werden die Details der Aufgabe angezeigt:

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Aufgabenliste" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Manueller Knoten_Beispiel_Beitragsprüfung_Aufgabendetails" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Der Administrator kann anhand der Beitragsdetails manuell entscheiden, ob der Beitrag veröffentlicht werden kann. Wenn ja, klicken Sie auf die Schaltfläche „Genehmigen“, und der Beitrag wird in den Status „Veröffentlicht“ aktualisiert. Wenn nicht, klicken Sie auf die Schaltfläche „Ablehnen“, und der Beitrag verbleibt im Status „Entwurf“.

## Genehmigung von Urlaubsanträgen

Angenommen, ein Mitarbeiter muss Urlaub beantragen, der erst nach Genehmigung durch einen Vorgesetzten wirksam wird und die entsprechenden Urlaubsdaten des Mitarbeiters abgezogen werden müssen. Unabhängig von Genehmigung oder Ablehnung wird über einen Anfrage-Knoten eine SMS-Schnittstelle aufgerufen, um eine Benachrichtigungs-SMS an den Mitarbeiter zu senden (siehe Abschnitt [HTTP-Anfrage](#_HTTP_请求)). Dieses Szenario lässt sich mithilfe eines benutzerdefinierten Formulars in einem manuellen Knoten umsetzen.

Erstellen Sie einen Workflow, der durch „Urlaubsantrag erstellen“ ausgelöst wird, und fügen Sie einen manuellen Knoten hinzu. Dies ähnelt dem vorherigen Beitragsprüfungsprozess, jedoch ist hier der Bearbeiter der Vorgesetzte. Fügen Sie in der Oberflächenkonfiguration einen Block basierend auf den Trigger-Daten hinzu, um die Details des neuen Urlaubsantrags anzuzeigen. Fügen Sie dann einen weiteren Block basierend auf einem benutzerdefinierten Formular hinzu, damit der Vorgesetzte entscheiden kann, ob er den Antrag genehmigt. Im benutzerdefinierten Formular fügen Sie ein Feld für den Genehmigungsstatus und ein Feld für den Ablehnungsgrund hinzu:

<figure>
  <img alt="Manueller Knoten_Beispiel_Urlaubsantrag genehmigen_Knotenkonfiguration" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Im Gegensatz zum Beitragsprüfungsprozess müssen wir hier den weiteren Workflow basierend auf dem Genehmigungsergebnis des Vorgesetzten fortsetzen. Daher konfigurieren wir hier nur eine Schaltfläche „Workflow fortsetzen“ für die Übermittlung und verwenden keine Schaltfläche „Workflow beenden“.

Gleichzeitig können wir nach dem manuellen Knoten einen Bedingungs-Knoten verwenden, um zu prüfen, ob der Vorgesetzte den Urlaubsantrag genehmigt hat. Im Genehmigungszweig fügen wir die Datenverarbeitung zum Abzug des Urlaubs hinzu und nach dem Zusammenführen der Zweige einen Anfrage-Knoten, um eine SMS-Benachrichtigung an den Mitarbeiter zu senden. Daraus ergibt sich der folgende vollständige Workflow:

<figure>
  <img alt="Manueller Knoten_Beispiel_Urlaubsantrag genehmigen_Workflow-Orchestrierung" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Die Bedingung im Bedingungs-Knoten ist wie folgt konfiguriert: „Manueller Knoten / Benutzerdefinierte Formulardaten / Wert des Genehmigungsfeldes ist ‚Genehmigt‘“:

<figure>
  <img alt="Manueller Knoten_Beispiel_Urlaubsantrag genehmigen_Bedingung" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Die Daten im Anfrage-Knoten können auch die entsprechenden Formularvariablen aus dem manuellen Knoten verwenden, um den SMS-Inhalt für Genehmigung und Ablehnung zu unterscheiden. Damit ist die Konfiguration des gesamten Workflows abgeschlossen. Nachdem der Workflow aktiviert wurde, kann der Vorgesetzte, sobald ein Mitarbeiter einen Urlaubsantrag einreicht, die Genehmigung in seinen Aufgaben bearbeiten. Der Vorgang ähnelt im Wesentlichen dem Beitragsprüfungsprozess.