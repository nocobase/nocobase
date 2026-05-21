# Kapitel 7: Workflow

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Glückwunsch zum letzten Kapitel! In diesem Kapitel stellen wir die starken Workflow-Funktionen von **NocoBase** vor und probieren sie aus. Damit können Sie Aufgaben im System automatisieren, Zeit sparen und die Effizienz steigern.

### Lösung der Bonusaufgabe aus dem letzten Kapitel

Bevor wir loslegen, ein kurzer Rückblick auf die Bonusaufgabe! Wir haben für die Rolle „Partner“ erfolgreich **Kommentar-Berechtigungen** konfiguriert, und zwar wie folgt:

1. **Hinzufügen-Berechtigung**: Benutzer dürfen Kommentare schreiben.
2. **Anzeigen-Berechtigung**: Benutzer dürfen alle Kommentare sehen.
3. **Bearbeiten-Berechtigung**: Benutzer dürfen nur eigene Kommentare bearbeiten.
4. **Löschen-Berechtigung**: Benutzer dürfen nur eigene Kommentare löschen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

Mit dieser Konfiguration kann Tom frei Kommentare verfassen und Kommentare anderer Mitglieder sehen, gleichzeitig sind Bearbeiten und Löschen auf seine eigenen Beiträge beschränkt.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

Setzen wir nun eine Automatisierung um: **Sobald der Verantwortliche einer Aufgabe gewechselt wird, soll das System automatisch eine Benachrichtigung an den neuen Verantwortlichen senden.**

> **Workflow:** Das Workflow-Plugin ist ein leistungsfähiges Automatisierungswerkzeug, wie es im Business Process Management (BPM) verbreitet ist.
>
> Es dient dazu, Geschäftsprozesse auf Basis von Datenmodellen zu entwerfen und zu orchestrieren. Mit Triggern und Prozessknoten lassen sich automatisierte Abläufe gestalten. Besonders geeignet für wiederkehrende, datengesteuerte Aufgaben.

### 7.1 Workflow erstellen

#### 7.1.1 Workflow im Backend anlegen

Wechseln Sie zunächst zur **Rolle Root** – der Rolle des Systemadministrators mit allen Rechten. Öffnen Sie dann das [**Workflow-Modul**](https://docs-cn.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

Klicken Sie oben rechts auf **„Hinzufügen“**, um einen neuen Workflow anzulegen, und tragen Sie die Grunddaten ein:

- **Name**: Systembenachrichtigung beim Wechsel des Verantwortlichen.
- **Trigger**: „Datentabellen-Event“ auswählen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 Erläuterungen zur Trigger-Auswahl:

1. [**Datentabellen-Event**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection): Wird ausgelöst, wenn sich Daten in der Datentabelle ändern (Hinzufügen, Ändern, Löschen). Sehr gut geeignet, um Feldänderungen wie den Wechsel des Verantwortlichen zu verfolgen.
2. [**Geplante Aufgabe**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule): Wird zu einem bestimmten Zeitpunkt automatisch ausgelöst – ideal für zeitbezogene Automatisierungen.
3. [**Post-Action-Event**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action): An eine Action-Schaltfläche gebunden; wird ausgelöst, wenn der Benutzer die Action ausführt. Beispiel: Auslösen nach Klick auf „Speichern“.

Mit weiteren Plugins lassen sich später noch andere Trigger freischalten – etwa „Pre-Action-Event“, „Custom-Action-Event“, „Genehmigung“ usw.

In unserem Szenario verwenden wir das [**Datentabellen-Event**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection), um Änderungen am Feld „Verantwortlich“ in der Aufgabentabelle zu verfolgen. Nach dem Speichern des Workflows klicken Sie auf **Konfigurieren**, um die Workflow-Einstellungen zu öffnen.

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 Workflow-Knoten konfigurieren

#### 7.2.1 Trigger-Bedingungen konfigurieren

Genug der Vorrede – starten wir den Aufbau der automatischen Benachrichtigung!

Wir konfigurieren zuerst den ersten Knoten und legen die Bedingungen fest, unter denen der Workflow startet.

- **Datentabelle**: „Aufgabentabelle“ auswählen. (Welche Tabelle den Workflow auslöst und ob die zugehörigen Daten in den Workflow eingelesen werden. Natürlich soll der Workflow starten, wenn sich die Aufgabentabelle ändert.)
- **Auslösezeitpunkt**: „Nach dem Hinzufügen oder Aktualisieren von Daten“ wählen.
- **Trigger-Feld**: „Verantwortlich“ wählen.
- **Trigger-Bedingung**: „Verantwortlich-ID existiert“ wählen, damit nur dann benachrichtigt wird, wenn ein Verantwortlicher zugewiesen wurde.
- **Vorgeladene Daten**: „Verantwortlich“ wählen, damit dessen Informationen im weiteren Verlauf nutzbar sind.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 Den Kanal „In-App-Nachricht“ aktivieren

Im nächsten Schritt erstellen wir einen Knoten, der die Benachrichtigung versendet.

Vorher legen wir einen [„In-App-Nachricht“-Kanal](https://docs-cn.nocobase.com/handbook/notification-in-app-message) für den Versand der Benachrichtigung an.

- Wechseln Sie zurück in den Plugin-Manager, wählen Sie „Benachrichtigungsmanagement“ und legen Sie eine Aufgabenbenachrichtigung (task_message) an.
- Nachdem der Kanal angelegt ist, wechseln wir zurück in den Workflow und legen einen neuen Knoten **„Benachrichtigung“** an.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- Knoten konfigurieren:
  **Kanal:** „Aufgabenbenachrichtigung“ wählen.
  **Empfänger:** „Trigger-Variablen/Trigger-Daten/Verantwortlich/ID“ wählen, damit der neue Verantwortliche eindeutig bestimmt wird.
  **Nachrichtentitel:** „Wechsel des Verantwortlichen“ eintragen.
  **Nachrichteninhalt:** „Sie wurden als neuer Verantwortlicher benannt“ eintragen.

Klicken Sie anschließend oben rechts auf den Schalter, um diesen Workflow zu aktivieren.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

Konfiguration abgeschlossen!

#### 7.2.3 Benachrichtigung testen

Spannender Moment: Zurück auf der Seite klicken wir auf eine beliebige Aufgabe, ändern den Verantwortlichen und senden ab. Schon ist die Systembenachrichtigung versandt!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

So funktioniert das Einrichten eines Workflows. Aber wir haben noch etwas zu tun:

Die generierte Benachrichtigung sollte dynamisch Aufgabeninformationen enthalten – sonst weiß niemand, welche Aufgabe gerade übergeben wurde.

### 7.3 Workflow verfeinern

#### 7.3.1 Versionsverwaltung

Zurück in der Workflow-Konfiguration werden Sie feststellen, dass die Workflow-Oberfläche grau und nicht editierbar ist.

Keine Sorge: Klicken Sie oben rechts auf das Auslassungssymbol > [**In neue Version kopieren**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions). Schon befinden Sie sich in der Konfiguration der neuen Version. Die alten Versionen bleiben erhalten – über die Schaltfläche **Versionen** können Sie jederzeit zwischen Versionen wechseln (Hinweis: bereits ausgeführte Workflow-Versionen können nicht mehr geändert werden!).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 Benachrichtigungsinhalt optimieren

Personalisieren wir den Inhalt nun mit zusätzlichen Übergabeinformationen.

- **Den Benachrichtigungsknoten bearbeiten.**

Den Nachrichteninhalt ändern in: „Aufgabe „【Aufgabenname】“, der Verantwortliche wurde gewechselt zu: 【Spitzname Verantwortlicher】“.

- Klicken Sie rechts auf die Variablen, um Aufgabenname und Verantwortlichen einzufügen.
- Aktivieren Sie anschließend oben rechts diese neue Version.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

Nach dem Aktivieren der aktualisierten Workflow-Version testen Sie erneut – die Systembenachrichtigung enthält jetzt den neuen Aufgabennamen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### Zusammenfassung

Großartig! Sie haben einen automatisierten Workflow basierend auf dem Wechsel des Verantwortlichen erstellt. Diese Funktion spart manuelle Arbeit und steigert die Effizienz der Teamarbeit. Damit hat Ihr Aufgabenverwaltungssystem leistungsstarke Funktionen erhalten.

---

### Fazit und Ausblick

Sie haben von Grund auf ein vollständiges Aufgabenverwaltungssystem gebaut – inklusive Aufgabenanlage, Kommentarfunktion, Rollen- und Rechtesystem sowie Workflow und Systembenachrichtigung.

Die Flexibilität und Erweiterbarkeit von NocoBase eröffnen Ihnen unbegrenzte Möglichkeiten. Sie können künftig weitere Plugins erkunden, Funktionen anpassen oder noch komplexere Geschäftslogik implementieren. Mit dem hier erlernten Wissen kennen Sie die Grundlagen und Kernkonzepte von NocoBase.

Wir freuen uns auf Ihre nächste Idee! Bei Fragen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) mitdiskutieren.

Erkunden Sie weiter und erschaffen Sie unbegrenzte Möglichkeiten!
