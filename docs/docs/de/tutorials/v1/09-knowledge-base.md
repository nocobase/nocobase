# Kapitel 8: Knowledge Base – Baumtabelle

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 Willkommen zum nächsten Kapitel

In diesem Kapitel beschäftigen wir uns intensiv mit dem Aufbau einer Knowledge Base. Es wird ein umfassendes Modul, das uns hilft, Dokumente, Aufgaben und Informationen zu verwalten und zu organisieren. Durch Entwurf und Erstellung einer baumartig strukturierten Dokumenttabelle realisieren wir eine effiziente Verwaltung von Status, Anhängen und verknüpften Aufgaben.

### 8.2 Erste Schritte beim Datenbankentwurf

#### 8.2.1 Grundentwurf und Anlegen der Dokumenttabelle

Wir starten mit einem einfachen Datenbankentwurf und legen für die Knowledge Base eine „Dokumenttabelle“ an, in der alle Dokumentinformationen erfasst werden. Die Dokumenttabelle umfasst die folgenden Schlüsselfelder:

1. **Titel (Title)**: Name des Dokuments, einzeiliger Text.
2. **Inhalt (Content)**: Detailinhalt des Dokuments, mehrzeiliger Text mit Markdown-Unterstützung.
3. **Status (Status)**: Markiert den aktuellen Status des Dokuments – Entwurf, Veröffentlicht, Archiviert oder Gelöscht.
4. **Anhang (Attachment)**: Dateien und Bilder als Anhänge, um den Dokumentinhalt anzureichern.
5. **Verknüpfte Aufgabe (Related Task)**: Viele-zu-Eins-Beziehungsfeld, um das Dokument mit einer bestimmten Aufgabe zu verbinden – nützlich, um Dokumente in der Aufgabenverwaltung zu referenzieren.

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

Mit der Funktionsweiterung ergänzen wir die Dokumentverwaltung schrittweise um zusätzliche Felder.

#### 8.2.2 Aufbau der Baumstruktur und Verzeichnisverwaltung

> Die Baumtabelle (vom Tree-Plugin bereitgestellt) ist eine baumartig strukturierte Tabelle, in der jeder Datensatz einen oder mehrere Unterdatensätze haben kann, die wiederum eigene Unterdatensätze haben können.

Damit das Dokumentmaterial strukturiert und hierarchisch geordnet ist, wählen wir für unsere Dokumenttabelle die [**Baumtabelle**](https://docs-cn.nocobase.com/handbook/collection-tree). So lässt sich eine Eltern-Kind-Hierarchie umsetzen. Beim Anlegen einer Baumtabelle generiert das System automatisch folgende Felder:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **Übergeordnete Datensatz-ID**: Speichert den übergeordneten Datensatz des aktuellen Dokuments.
- **Übergeordneter Datensatz**: Viele-zu-Eins-Feld, das die Eltern-Beziehung herstellt.
- **Untergeordnete Datensätze**: Eins-zu-Viele-Feld, mit dem alle Unterdokumente eines Dokuments einsehbar werden.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

Diese Felder dienen dazu, die Verzeichnisebenen einer Baumtabelle zu pflegen. Sie sollten nicht verändert werden.

Außerdem benötigen wir eine Verknüpfung [(Viele-zu-Eins)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) zur Aufgabentabelle, idealerweise mit Reverse-Beziehung, damit wir bei Bedarf in einer Popup-Ansicht der Aufgabe eine Dokumentliste anlegen können.

### 8.3 Seite zur Dokumentverwaltung anlegen

#### 8.3.1 Menüeintrag „Dokumentverwaltung“

Fügen Sie im Hauptmenü des Systems eine neue Seite „Dokumentverwaltung“ hinzu und wählen Sie ein passendes Icon aus. Erstellen Sie anschließend einen Tabellen-Block für unsere Dokumenttabelle. Im Tabellen-Block ergänzen Sie die grundlegenden CRUD-Operationen und legen einige Test-Datensätze an, um zu prüfen, ob der Tabellenentwurf wie erwartet funktioniert.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### Übung

1. Legen Sie auf der Dokumentverwaltungsseite ein Dokument namens „Dokument 1“ als Eltern-Dokument an.
2. Fügen Sie unter „Dokument 1“ ein Unterdokument „Kapitel 1“ hinzu.

#### 8.3.2 In Baum-Tabellenansicht umwandeln

Vielleicht fragen Sie sich, warum die Ansicht keine Verzeichnisbaumstruktur ist?

Standardmäßig zeigt der Tabellen-Block eine normale Tabellenansicht. Aktivieren wir die Baum-Tabellenansicht manuell:

1. Klicken Sie oben rechts im Tabellen-Block auf > Baum-Tabellenansicht.

   Sobald Sie das aktivieren, erscheint unterhalb der Baum-Tabelle der Schalter „Alle ausklappen“.

   Außerdem verschwindet das soeben angelegte „Kapitel 1“.
2. Klicken Sie unterhalb der Baum-Tabelle auf „Alle ausklappen“.

   Jetzt wird die Eltern-Kind-Struktur der Dokumente anschaulich dargestellt – Sie können alle Hierarchieebenen einsehen und ausklappen.

   Ergänzen Sie nebenbei die Action „Unterdatensatz hinzufügen“.

Die Umwandlung in die Baumtabelle ist erfolgreich!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 Konfiguration „Unterdatensatz hinzufügen“

Skizzieren wir die Grundkonfiguration. Beachten Sie: Wenn Sie das Feld „Übergeordneter Datensatz“ auswählen, ist es standardmäßig **„nur lesbar (nicht editierbar)“**, weil die Erstellung standardmäßig unter dem aktuellen Dokument erfolgt.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

Wenn die Aufgaben sehr zahlreich werden, ist die Zuweisung der verknüpften Aufgabe mühsam. Setzen wir einen Standardwert für die Aufgabenfilter-Einstellung – die verknüpfte Aufgabe des Eltern-Datensatzes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

Falls der Standardwert nicht sofort übernommen wird, schließen und erneut öffnen – schon ist er automatisch eingetragen!

### 8.4 Formularvorlagen und Aufgabenverknüpfung konfigurieren

#### 8.4.1 Tabellen- und Formular-[Vorlagen](https://docs-cn.nocobase.com/handbook/block-template) anlegen

Damit wir Dokumente künftig komfortabel verwalten können, [speichern wir die Tabelle sowie die Formulare zum Erstellen und Bearbeiten als Vorlage](https://docs-cn.nocobase.com/handbook/block-template), die wir auf anderen Seiten wiederverwenden können.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 Tabellen-Block für Dokumente per Vorlage einbinden

Im Anzeigen-Popup der Aufgabentabelle fügen wir einen neuen [Tab](https://docs-cn.nocobase.com/manual/ui/pages) namens „Dokumente“ hinzu. Im Tab fügen Sie einen Block hinzu > Andere Datensätze > Dokumenttabelle > „Vorlage kopieren“ > die zuvor angelegte Dokumentformular-Vorlage einbinden. (Wichtig: [**Vorlage kopieren**](https://docs-cn.nocobase.com/handbook/block-template) auswählen.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

So lassen sich Dokumentlisten überall einfach erstellen.

#### 8.4.3 Verknüpfung mit der Aufgabe einrichten

Da wir die externe Tabellenvorlage kopiert haben, ist sie noch nicht mit der Aufgabentabelle verknüpft. Das Ergebnis: Es werden alle Dokumentdaten angezeigt – nicht das, was wir möchten.

Das passiert recht häufig: Wenn kein passendes Beziehungsfeld existiert, wir aber verknüpfte Daten anzeigen möchten, müssen wir die Verknüpfung manuell herstellen. (Wir verwenden ausdrücklich [**Vorlage kopieren**](https://docs-cn.nocobase.com/handbook/block-template), nicht [Vorlage referenzieren](https://docs-cn.nocobase.com/handbook/block-template), damit unsere Änderungen nicht in andere Tabellen-Blocks zurücklaufen!)

- Datenanzeigeverknüpfung

Klicken Sie oben rechts im Tabellen-Block auf [„Datenbereich konfigurieren“](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope) und setzen Sie:

【Aufgabe/ID】= 【Aktueller Popup-Datensatz/ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

Erfolgreich! Nun bleiben in der Tabelle nur Dokumente, die mit der aktuellen Aufgabe verknüpft sind.

- Verknüpfung im Hinzufügen-Formular einrichten.

Im Hinzufügen-Block:

Setzen Sie für das Feld der verknüpften Aufgabe den [Standardwert](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) auf 【Datensatz des übergeordneten Popups】.

Das übergeordnete Popup ist die „Anzeigen“-Action der aktuellen Aufgabendaten – damit wird automatisch die zugehörige Aufgabe verknüpft.

Setzen Sie das Feld auf [Nur lesen (Lesemodus)](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern), damit innerhalb dieses Popups ausschließlich die aktuelle Aufgabe verknüpft werden kann.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

Erledigt! Anlegen und Anzeigen erfolgen nun mit der Aufgabenverknüpfung.

Wenn Sie es ganz genau nehmen möchten, ergänzen Sie die Filter auch in „Bearbeiten“ und „Unteraufgabe hinzufügen“.

Damit die Baumstruktur klarer und die Aktionsspalte aufgeräumter wirkt, verschieben wir den Titel in die erste Spalte.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 Filterung und Suche in der Dokumentverwaltung

#### 8.5.1 [Filter-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) hinzufügen

Ergänzen wir die Dokumenttabelle um eine Filterfunktion.

- Fügen Sie auf der Dokumentverwaltungsseite einen [Filter-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) hinzu.
- Wählen Sie das Filter-Formular und ziehen Sie es nach oben.
- Aktivieren Sie als Filterbedingung Felder wie Titel, Status und das Aufgabenfeld.
- Fügen Sie Actions „Filter“ und „Zurücksetzen“ hinzu.

Dieses Formular ist die Suchleiste, mit der Sie nach Stichworten Dokumente schnell finden können.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [Datenblöcke verbinden](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

Wahrscheinlich passiert beim Klicken noch nichts. Es fehlt der letzte Schritt: Die Suchblöcke müssen miteinander verbunden werden.

- Klicken Sie oben rechts im Block auf Konfiguration > [Datenblöcke verbinden](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  Hier sehen Sie alle verbindbaren Blocks.

  Da wir ein Filter-Formular für die Dokumenttabelle erstellt haben, werden alle Daten-Blocks gesucht, die mit der Dokumenttabelle verknüpft sind (in unserem Fall nur einer), und zur Auswahl angeboten.

  Sie müssen nicht raten – beim Hover springt der Bildschirm automatisch in den Bereich des entsprechenden Blocks.
  ```
- Aktivieren Sie den Block, der gefiltert werden soll, und testen Sie die Suche.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

Klicken Sie oben rechts auf die Konfiguration des Filter-Blocks und verbinden Sie ihn mit dem Hauptdaten-Block der Dokumenttabelle. Jedes Mal, wenn Sie die Bedingungen im Filter-Block ändern, aktualisiert der Tabellen-Block automatisch die Ergebnisse.

### 8.6 [Berechtigungen für die Knowledge Base](https://docs-cn.nocobase.com/handbook/acl)

Damit Dokumente sicher und geordnet bleiben, lassen sich [Berechtigungen](https://docs-cn.nocobase.com/handbook/acl) für die Dokumentbibliothek nach Rollen zuweisen. Je nach Rolle können Benutzer Dokumente anzeigen, bearbeiten oder löschen.

Da wir die Dokumenttabelle anschließend um News- und Aufgaben-Ankündigungs-Funktionen erweitern, können die Berechtigungen ruhig etwas großzügiger gesetzt werden.

### 8.7 Zusammenfassung und nächste Schritte

In diesem Kapitel haben wir eine grundlegende Knowledge Base aufgebaut, einschließlich Dokumenttabelle, [Baumstruktur](https://docs-cn.nocobase.com/handbook/collection-tree) und Verknüpfungsanzeige zur Aufgabentabelle. Mit Filter-Blocks und Vorlagenwiederverwendung haben wir eine effiziente Dokumentverwaltung realisiert.

Im [nächsten Kapitel](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1) lernen wir, wie Sie ein persönliches Dashboard mit [Datenanalyse-Diagrammen](https://docs-cn.nocobase.com/handbook/data-visualization) und wichtigen Informationen aufbauen!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
