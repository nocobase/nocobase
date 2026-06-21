# Kapitel 3: Aufgabendatenverwaltung

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Nachdem wir die Anforderungen unseres Aufgabenverwaltungssystems geklärt haben, ist es Zeit für die praktische Umsetzung! Erinnern Sie sich: Unser System soll Aufgaben **[anlegen](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [bearbeiten](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) und [löschen](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** sowie eine **Aufgabenliste abfragen** können – all das lässt sich in NocoBase über Seiten, Blocks und Actions umsetzen.

> Sehen Sie in der offiziellen Dokumentation die genauen Definitionen für [Menüs](https://docs-cn.nocobase.com/handbook/ui/menus) und [Seiten](https://docs-cn.nocobase.com/handbook/ui/pages) ein.

### 3.1 Wo fangen wir an?

Sie erinnern sich vielleicht: Wir hatten bereits gezeigt, wie man eine neue Seite anlegt und die Benutzerliste anzeigt. Diese Seiten sind wie eine Leinwand – Sie können sie mit verschiedenen Blocks füllen, die Sie frei in Reihenfolge und Größe anordnen. Zur Auffrischung hier noch einmal die wichtigsten Schritte:

1. [**Neue Seite anlegen**](https://docs-cn.nocobase.com/handbook/ui/pages): Mit wenigen Klicks erstellt.
   ![Neue Seite anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **Neuen [Tabellen-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) anlegen**: Wählen Sie einen Tabellen-Block, um unterschiedliche Daten anzuzeigen.
   ![Neuer Tabellen-Block](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

Klingt ganz einfach, oder?
Wenn Sie jedoch die „Datenliste“ öffnen, werden Sie feststellen, dass die Standardauswahl nur die Tabellen „Benutzer“ und „Rollen“ enthält.
Wo ist denn jetzt die Aufgabentabelle? Keine Sorge – die Antwort steckt in der Funktion [**Datenquelle**](https://docs-cn.nocobase.com/handbook/data-source-manager) von NocoBase.

> **Datenquellen kurz erklärt:** Eine Datenquelle kann eine Datenbank, eine API oder eine andere Datenspeicherart sein. Verschiedene relationale Datenbanken wie MySQL, PostgreSQL, SQLite und MariaDB werden unterstützt.
> NocoBase liefert bereits ein **Plugin zur Datenquellenverwaltung** mit, das die Verwaltungsoberfläche bereitstellt. Es bietet jedoch selbst keine Anbindungsfähigkeit – es muss zusammen mit den jeweiligen **Datenquellen-Plugins** verwendet werden.

### 3.2 Datenquelle: Ihr Lager für Datentabellen

![](https://static-docs.nocobase.com/20241009144356.png)

In NocoBase werden alle Datentabellen in der [**Datenquelle**](https://docs-cn.nocobase.com/handbook/data-source-manager) abgelegt. Eine Datenquelle ist wie ein Buch, in dem das Design und die Struktur jeder Datentabelle festgehalten ist. Schreiben wir gemeinsam unser eigenes neues Kapitel: die **Aufgabentabelle**.

> [!NOTE] Hinweis
> Wenn Sie mehr über die Möglichkeiten von Datenquellen und Datentabellen erfahren möchten, lesen Sie [Datenquellenverwaltung](https://docs-cn.nocobase.com/handbook/data-source-manager) und [Übersicht über Datentabellen](https://docs-cn.nocobase.com/handbook/data-modeling/collection).

- **In die Datenquellen-Einstellungen wechseln**:
  - Klicken Sie oben rechts auf **Einstellungen** > **Datenquelle** > **Konfiguration der Hauptdatenquelle**.
  - Sie sehen alle vorhandenen Tabellen der Hauptdatenquelle von NocoBase – standardmäßig nur „Benutzer“ und „Rollen“.
    ![Datenquellenkonfiguration](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

Jetzt ist es Zeit, die dritte Tabelle anzulegen, nämlich unsere **Aufgabentabelle**. Das wird unsere erste eigene Datentabelle in NocoBase – ein spannender Moment! Wir folgen dabei dem zuvor entworfenen Design und legen eine einfache Aufgabentabelle mit folgenden Feldern an:

```
Aufgabentabelle (Tasks):
        Aufgabenname (task_name) Einzeiliger Text
        Aufgabenbeschreibung (task_description) Mehrzeiliger Text
```

### 3.3 Aufgabentabelle anlegen

1. **Neue Aufgabentabelle anlegen**:

   - Klicken Sie auf „Datentabelle erstellen“ > wählen Sie **Normale Datentabelle** > tragen Sie als **Tabellenname** „Aufgabentabelle“ und als **Tabellen-Kennung** „tasks“ ein.
   - Die **Tabellen-Kennung** ist die eindeutige ID der Tabelle. Verwenden Sie englische Buchstaben, Ziffern oder Unterstriche, um spätere Suche und Wartung zu erleichtern.
   - Bestätigen Sie das Anlegen.
     ![Aufgabentabelle anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **Erläuterung der Standardfelder**:
   NocoBase erstellt für jede normale Datentabelle einige voreingestellte Felder:

   - **ID**: Eindeutige Kennung für jeden Datensatz.
   - **Erstellungsdatum**: Erfasst automatisch den Erstellungszeitpunkt der Aufgabe.
   - **Erstellt von**: Speichert automatisch den Ersteller der Aufgabe.
   - **Letzte Änderung** und **Geändert von**: Erfasst Zeitpunkt und Benutzer jeder Änderung.

Diese Standardfelder sind genau das, was wir brauchen, und ersparen uns viel manuelle Arbeit.

3. **Eigene Felder anlegen**:
   - **Aufgabenname**: Klicken Sie auf „Feld hinzufügen“ > wählen Sie **Einzeiliger Text** > setzen Sie den Feldnamen auf „Aufgabenname“ und die Feld-Kennung auf „task_name“.
     ![Feld „Aufgabenname“ anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **Aufgabenbeschreibung**: Legen Sie ein **mehrzeiliges Textfeld** an, Feld-Kennung „task_description“.
     ![Feld „Aufgabenbeschreibung“ anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

Glückwunsch! Die **Aufgabentabelle** ist nun definiert und Sie haben Ihre erste eigene Aufgabendatenstruktur erfolgreich erstellt. Daumen hoch!

### 3.4 Seite zur Aufgabenverwaltung erstellen

Jetzt, da wir die Aufgabentabelle haben, präsentieren wir sie als Nächstes mit einem geeigneten Block in einem Seitencontainer. Wir legen eine neue **Aufgabenverwaltungsseite** an und fügen einen Tabellen-Block hinzu, der die Aufgabendaten anzeigt.

1. **Neue Aufgabenverwaltungsseite**:

   - Klicken Sie auf „Neue Seite“ und nennen Sie sie „Aufgabenverwaltung“.
   - Erstellen Sie einen Aufgaben-Block, der die Daten der Aufgabentabelle anzeigt.
     ![Aufgaben-Block anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **Daten hinzufügen**:

   - „Hm, warum sehe ich keine Daten?“ – kein Problem, wir fügen sie jetzt hinzu!
   - Klicken Sie oben rechts auf der Seite auf „Action konfigurieren“ und wählen Sie die Action **„Hinzufügen“** aus. Es erscheint ein leerer Popup-Container.
     [Hinzufügen](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new) und [Bearbeiten](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) sind standardmäßig mit Popups verknüpft.
   - Nun kommt ein neuer Block (Formular) zum Einsatz: Popup-Block erstellen > **Aktuelle Datentabelle** auswählen.
   - Zeigen Sie die Felder Aufgabenname und -beschreibung an, konfigurieren Sie die Submit-Action, und das Formular ist fertig zum Absenden!
     ![Action konfigurieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **Daten erfassen**:

   - Geben Sie einen Test-Datensatz ein, klicken Sie auf „Senden“ – fertig! Die Aufgabendaten sind angelegt.
     ![Daten senden](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

Ein spannender Moment! Sie haben Ihren ersten Aufgaben-Datensatz angelegt – ganz einfach, oder?

### 3.5 Aufgabensuche und Filter – Aufgaben schnell finden

Wenn die Anzahl der Aufgaben wächst, wie finden Sie eine bestimmte Aufgabe schnell? Hier kommt die [**Filter-Action**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter) ins Spiel. In NocoBase können Sie über die Bedingungen der Filter-Action gezielt nach bestimmten Aufgaben suchen.

#### 3.5.1 Filter-Action aktivieren

Zunächst aktivieren wir die Filter-Action:

- **Bewegen Sie den Mauszeiger auf „Action konfigurieren“**, klicken Sie dann auf den **Filter-Schalter**, um den Filter zu aktivieren.
  ![Filter aktivieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 Filterbedingungen verwenden

Nach dem Aktivieren erscheint die Filter-Schaltfläche auf der Seite. Wir testen sie nun mit dem **Aufgabennamen**:

- Wählen Sie im Filter-Panel den Aufgabennamen aus und geben Sie den gewünschten Suchbegriff ein.
- Klicken Sie auf „Senden“ und prüfen Sie, ob die Aufgabenliste das gefilterte Ergebnis korrekt anzeigt.
  ![Filter aktivieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 Filter-Action deaktivieren

Wenn Sie die Filter-Action nicht mehr benötigen, können Sie sie – wie bei allen Schalter-Actions – mit einem Klick wieder ausschalten:

- **Filterbedingungen zurücksetzen**: Stellen Sie sicher, dass keine Filterbedingungen aktiv sind, und klicken Sie auf „Zurücksetzen“.
- Klicken Sie erneut auf den **„Filter“-Schalter**, dann verschwindet der Filter wieder von der Seite.
  ![Filter ausblenden](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

So einfach! Die Filter-Action ist eine große Hilfe bei der Verwaltung vieler Aufgaben. Mit zunehmender Vertrautheit werden Sie weitere flexible Suchmöglichkeiten kennenlernen. (Sehen Sie sich auch [Filter-Block: Formular](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) und [Filter-Block: Faltbares Panel](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse) an.)

Bleiben Sie neugierig – auf zum nächsten Schritt!

### 3.6 Aufgaben bearbeiten und löschen

Neben dem Anlegen und Suchen müssen wir Aufgaben auch [**bearbeiten**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) und [**löschen**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) können. Da Sie das Hinzufügen von Blocks, Feldern und Actions schon kennen, ist das jetzt ganz einfach:

1. **Aufgabe bearbeiten**:

   - Fügen Sie in der Aufgabenliste die Action **Bearbeiten** hinzu, klicken Sie auf „Bearbeiten“ > erstellen Sie einen Formular-Block (Bearbeiten) > wählen Sie die Felder aus, die bearbeitet werden sollen.
2. **Aufgabe löschen**:

   - Aktivieren Sie ebenso in der Konfiguration der Aktionsspalte den **Löschen**-Schalter; sobald die Schaltfläche erscheint, klicken Sie auf „Löschen“ > bestätigen, und die Aufgabe wird aus der Liste entfernt.
     ![Aufgabe bearbeiten](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

Damit sind nun alle CRUD-Operationen (Anlegen, Lesen, Aktualisieren, Löschen) für die Aufgabenliste umgesetzt.

Großartig! Sie haben diesen Schritt erfolgreich abgeschlossen!

### Bonusaufgabe

Wenn Sie sicherer im Umgang mit NocoBase werden, versuchen Sie sich an einer kleinen Herausforderung: Wir wollen den Status einer Aufgabe markieren und Datei-Anhänge unterstützen – wie geht das?

Tipps:

- Erweitern Sie die Aufgabentabelle um:
  1. Ein Feld **Status (status)** als Einzelauswahl-Dropdown mit den Optionen: **Nicht begonnen, In Bearbeitung, Zu prüfen, Abgeschlossen, Abgebrochen, Archiviert**.
  2. Ein Feld **Anhang (attachment)**.
- Zeigen Sie die Felder „Status“ und „Anhang“ im Aufgaben-Tabellen-Block sowie im Formular-Block für „Hinzufügen“ und „Bearbeiten“ an.

Haben Sie eine Idee? Geduld – das [nächste Kapitel (Kapitel 4: Aufgaben- und Kommentar-Plugins – mit zusätzlichem Schub den Überblick behalten)](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use) verrät die Antwort!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
