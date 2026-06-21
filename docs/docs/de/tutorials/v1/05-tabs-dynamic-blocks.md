# Kapitel 5: Tabs und dynamische Blocks

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Willkommen zu Kapitel 5! Dieses Kapitel hat es in sich: Wir erweitern die Aufgabenverwaltungsseite um zusätzliche Funktionen und unterstützen verschiedene Ansichten. Sicher haben Sie schon darauf gewartet! Keine Sorge, wir machen das wie immer Schritt für Schritt – locker und souverän.

### 5.1 Tab-Container, der verschiedene Blocks aufnimmt

Wir haben die Aufgabenverwaltungsseite bereits erstellt. Damit das System noch übersichtlicher wird, sollen Aufgaben innerhalb der Seite zwischen verschiedenen Darstellungen wechseln können – etwa [**Tabelle**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table), [**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**Kalender**](https://docs-cn.nocobase.com/handbook/calendar) oder sogar [**Gantt-Diagramm**](https://docs-cn.nocobase.com/handbook/block-gantt). Mit den Tabs von NocoBase können wir auf derselben Seite zwischen verschiedenen Block-Arrangements wechseln. Wir gehen das ruhig an.

- Tabs erstellen
  Zuerst legen wir die Tabs an.

1. **Neuen Sub-Tab anlegen**:

   - Öffnen Sie Ihre Aufgabenverwaltungsseite und legen Sie einen Sub-Tab an. Den ersten Tab nennen wir **„Tabellenansicht“**. In dieser Ansicht zeigen wir den bereits konfigurierten Tabellen-Block der Aufgaben.
2. **Einen weiteren Tab anlegen**:

   - Erstellen Sie nun einen weiteren Tab namens **„Kanban-Ansicht“**. Hier legen wir den Kanban-Block für die Aufgaben an.
     ![Tabs anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

Bereit? Auf zu den verschiedenen Blocks!

> **Blocks kurz erklärt:** Ein Block ist der Träger von Daten und Inhalten. Er stellt Daten passend auf der Website dar und kann auf Seiten (Page), in Dialogen (Modal) oder in Drawern (Drawer) platziert werden. Mehrere Blocks lassen sich frei per Drag-and-Drop arrangieren; durch fortlaufende Operationen in Blocks können verschiedenste Konfigurationen und Darstellungen entstehen.
> Mit Blocks lassen sich Seiten und Funktionen unseres Systems wesentlich schneller umsetzen und verwalten. Außerdem können Sie Blocks als Vorlagen speichern und so kopieren oder referenzieren – das spart enorm viel Zeit beim Anlegen neuer Blocks.

### 5.2 Kanban-Block: Aufgabenstatus auf einen Blick

Das [**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban) ist eine sehr wichtige Funktion in einem Aufgabenverwaltungssystem: Per Drag-and-Drop verwalten Sie den Status von Aufgaben anschaulich. So können Sie Aufgaben nach Status gruppieren und sofort sehen, in welcher Phase sich eine Aufgabe befindet.

#### 5.2.1 Kanban-Block anlegen

1. **Neuen Kanban-Block erstellen**:

- Klicken Sie im Tab **Kanban-Ansicht** auf „Block erstellen“ und wählen Sie die Aufgabentabelle aus. Es erscheint eine Auswahl, nach welchem Feld die Aufgaben gruppiert werden sollen.

2. **Gruppierungsfeld auswählen**:

- Wählen Sie das zuvor angelegte Feld **Status**, um nach Status zu gruppieren. (Hinweis: Das Gruppierungsfeld muss vom Typ [„Dropdown (Einzelauswahl)“](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) oder [„Optionsfelder“](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group) sein.)

3. **Sortierfeld hinzufügen**:

- Die Karten im Kanban lassen sich über ein Sortierfeld in eine bestimmte Reihenfolge bringen. Dafür legen wir ein neues Sortierfeld an. Klicken Sie auf „Feld hinzufügen“ und legen Sie das Feld **Statussortierung (status_sort)** an.
- Dieses Feld bestimmt beim Drag-and-Drop die vertikale Reihenfolge der Karten – wie eine Koordinate: Links und rechts unterscheiden sich die Status (Spalten), oben und unten der Sortierwert. Beim Verschieben der Karten können Sie später im Formular sehen, wie sich der Sortierwert ändert.
  ![Kanban-Block anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 Felder und Actions auswählen

- Vergessen Sie nicht, im Kanban-Block die anzuzeigenden Felder auszuwählen, etwa Aufgabenname und Status, damit jede Karte alle wichtigen Informationen enthält.

![Kanban-Felder anzeigen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 Vorlagen verwenden: Kopieren oder Referenzieren

Nach dem Anlegen des Kanban-Blocks brauchen wir ein **Hinzufügen-Formular**. NocoBase bietet hier eine sehr praktische Funktion – Sie können das vorhandene Formular [**kopieren** oder **referenzieren**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) und müssen es nicht jedes Mal neu konfigurieren.

#### 5.3.1 **Formular als Vorlage speichern**

- Bewegen Sie im vorherigen Hinzufügen-Formular den Mauszeiger auf die Formularkonfiguration und klicken Sie auf „Als Vorlage speichern“. Geben Sie der Vorlage einen Namen, etwa „Aufgabentabelle_Formular Hinzufügen“.

![Formular als Vorlage speichern](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **Vorlage kopieren oder referenzieren**

Wenn Sie in der Kanban-Ansicht ein neues Formular anlegen, sehen Sie zwei Optionen: „**Vorlage kopieren**“ und „**Vorlage referenzieren**“. Wo liegt der Unterschied?

- [**Vorlage kopieren**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): Erstellt eine eigenständige Kopie des Formulars. Änderungen wirken sich nicht auf das Original aus.
- [**Vorlage referenzieren**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): „Leiht“ das ursprüngliche Formular. Änderungen werden in alle Stellen synchronisiert, die diese Vorlage referenzieren. Wenn Sie z. B. die Feldreihenfolge ändern, ändern sich alle referenzierenden Formulare entsprechend.

![Vorlage kopieren und referenzieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

Wählen Sie je nach Bedarf zwischen Kopieren und Referenzieren. Im Allgemeinen ist **Vorlage referenzieren** komfortabler: Sie ändern nur an einer Stelle und alle abhängigen Formulare werden automatisch aktualisiert – sehr zeitsparend.

### 5.4 Kalender-Block: Aufgabenfortschritt auf einen Blick

Als Nächstes erstellen wir einen [**Kalender-Block**](https://docs-cn.nocobase.com/handbook/calendar), um die Zeitplanung von Aufgaben besser zu organisieren.

#### 5.4.1 Kalenderansicht anlegen

##### 5.4.1.1 **Datumsfelder anlegen**:

Die Kalenderansicht muss die **Start-** und **Enddaten** der Aufgaben kennen. Daher legen wir in der Aufgabentabelle zwei neue Felder an:

- **Startdatum (start_date)**: Markiert den Beginn der Aufgabe.
- **Enddatum (end_date)**: Markiert das Ende der Aufgabe.

![Datumsfelder anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 Kalender-Block anlegen:

Wechseln Sie zurück in die Kalenderansicht und legen Sie einen Kalender-Block an. Wählen Sie die Aufgabentabelle und nutzen Sie die soeben erstellten Felder **Startdatum** und **Enddatum**. Aufgaben werden dann als Zeitspanne im Kalender dargestellt – ein anschaulicher Überblick.

![Kalender-Ansicht aufbauen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 Kalender ausprobieren:

Im Kalender können Sie Aufgaben frei verschieben oder anklicken, um Details zu bearbeiten (denken Sie an das Kopieren oder Referenzieren der Vorlage).

![Kalender bedienen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 Gantt-Block: das Werkzeug für die Aufgabenplanung

Der letzte Block ist der [**Gantt-Block**](https://docs-cn.nocobase.com/handbook/block-gantt) – ein bekanntes Werkzeug aus dem Projektmanagement, mit dem Sie Fortschritt und Abhängigkeiten von Aufgaben verfolgen können.

#### 5.5.1 Tab „Gantt-Ansicht“ anlegen

#### 5.5.2 **Feld „Fertigstellungsgrad“ anlegen**:

Damit das Gantt-Diagramm den Aufgabenfortschritt gut darstellen kann, legen wir ein neues Feld **Fertigstellungsgrad (complete_percent)** an. Dieses Feld speichert den Fortschritt der Aufgabe, Standardwert 0 %.

![Feld „Fertigstellungsgrad“ anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **Gantt-Block erstellen**:

In der Gantt-Ansicht legen Sie einen Gantt-Block an, wählen die Aufgabentabelle und konfigurieren die zugehörigen Felder Startdatum, Enddatum und Fertigstellungsgrad.

![Gantt-Ansicht aufbauen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **Drag-and-Drop im Gantt-Block ausprobieren**:

Im Gantt-Block können Sie Aufgaben durch Verschieben in Fortschritt und Zeit anpassen – Startdatum, Enddatum und Fertigstellungsgrad werden entsprechend aktualisiert.

![Gantt-Drag-and-Drop](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### Zusammenfassung

Großartig! Sie können nun in NocoBase verschiedene Blocks zur Darstellung von Aufgabendaten verwenden, darunter [**Kanban-Block**](https://docs-cn.nocobase.com/handbook/block-kanban), [**Kalender-Block**](https://docs-cn.nocobase.com/handbook/calendar) und [**Gantt-Block**](https://docs-cn.nocobase.com/handbook/block-gantt). Diese Blocks machen die Aufgabenverwaltung anschaulich und sehr flexibel.

Aber das ist erst der Anfang! Stellen Sie sich ein Team vor, in dem Mitglieder unterschiedliche Aufgaben haben. Wie sorgen Sie dafür, dass alle reibungslos zusammenarbeiten? Wie stellen Sie sicher, dass Daten geschützt sind und jeder nur das sieht und bearbeitet, was ihn betrifft?

Bereit? Dann auf zum nächsten Kapitel: [Kapitel 6: Mit den richtigen Mitstreitern – Zusammenarbeit ohne Reibungsverluste, flexibel im Griff](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions).

Wir zeigen Ihnen, wie Sie mit einfachen Schritten die Zusammenarbeit Ihres Teams auf das nächste Level heben!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
