# Kapitel 11: Unteraufgaben und Arbeitszeitberechnung

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Endlich ist das nächste Kapitel da! Mit wachsendem Geschäft werden Aufgaben zahlreicher und komplexer. Eine einfache Aufgabenverwaltung reicht nicht mehr – wir benötigen eine feinere Verwaltung mit mehreren Ebenen, um effizienter arbeiten zu können.

### 11.1 Aufgaben planen: vom Großen zum Kleinen

Wir zerlegen komplexe Aufgaben in mehrere handhabbare Teilaufgaben, verfolgen den Fortschritt und unterstützen über Mehrebenen-Strukturen die Organisation der Unteraufgaben. Auf geht’s mit der Planung!

---

### 11.2 Unteraufgaben-Tabelle anlegen

#### 11.2.1 Struktur der Unteraufgaben entwerfen

Wir legen zunächst eine „Unteraufgaben-Tabelle“ (Sub Tasks – [**Baumtabelle**](https://docs-cn.nocobase.com/handbook/collection-tree)) an und gestalten sie als Baumstruktur. Die Eigenschaften ähneln denen der Hauptaufgabe – Aufgabenname, Status, Verantwortlich, Fortschritt usw. Bei Bedarf lassen sich Kommentare, Dokumente und weitere Inhalte ergänzen.

Damit Unteraufgaben mit ihrer Hauptaufgabe verknüpft sind, legen wir eine Viele-zu-Eins-Beziehung an, sodass jede Unteraufgabe einer Hauptaufgabe zugeordnet ist. Außerdem richten wir eine Reverse-Beziehung ein, um Unteraufgaben direkt aus der Hauptaufgabe heraus anzuzeigen oder zu verwalten.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> Tipp: Es ist komfortabler, Unteraufgaben direkt aus der Hauptaufgabenseite über einen verknüpften Block anzulegen.

#### 11.2.2 Unteraufgaben in der Aufgabenverwaltung anzeigen

Auf der Aufgabenverwaltungsseite stellen wir die Anzeigeart der „Aufgabentabelle“ auf [**Seitenmodus**](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2) um.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

Auf der Seite legen wir einen neuen Tab „Unteraufgabenverwaltung“ an, fügen die zuvor erstellte Unteraufgaben-Tabelle hinzu und zeigen sie als Baumstruktur an. So lassen sich Unteraufgaben auf derselben Seite verwalten.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3 Arbeitszeit-Vergleichsdiagramm: Gesamtarbeitszeit und Fortschritt schätzen (optional)

Im Anschluss erstellen wir Arbeitszeit-Details und ein Vergleichsdiagramm, um die Gesamtarbeitszeit und den Aufgabenfortschritt einzuschätzen.

#### 11.3.1 Zeit- und Arbeitszeitfelder zur Unteraufgabe hinzufügen

Ergänzen Sie in der Unteraufgaben-Tabelle die folgenden Felder:

- **Startdatum**
- **Enddatum**
- **Gesamtarbeitszeit**
- **Verbleibende Arbeitszeit**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

Mit diesen Feldern lassen sich Dauer und Arbeitszeit dynamisch berechnen.

#### 11.3.2 Aufgabendauer berechnen

Wir legen in der Unteraufgaben-Tabelle ein neues [Formelfeld](https://docs-cn.nocobase.com/handbook/field-formula) „Tage“ an, um die Dauer der Aufgabe zu berechnen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

Mögliche Berechnungsmethoden:

- Math.js

  > Verwendet die Bibliothek [math.js](https://mathjs.org/) für komplexe numerische Formeln.
  >
- Formula.js

  > Verwendet die Bibliothek [Formula.js](https://formulajs.info/functions/) für gängige Formeln. Wenn Sie sich mit Excel-Formeln auskennen, fühlen Sie sich hier sofort wohl.
  >
- String-Vorlage

  > Wie der Name sagt: Zeichenketten werden zusammengesetzt. Praktisch für dynamische Beschreibungen oder Nummern.
  >

Hier können wir die Bibliothek `Formula.js` verwenden, ähnlich wie Excel-Formeln, um eine gängige Berechnung umzusetzen.

Die Formel für das Tagefeld lautet:

```html
DAYS(Enddatum,Startdatum)
```

Achten Sie darauf, kleinbuchstaben-konformes Englisch zu verwenden, um Fehler zu vermeiden.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

Probieren Sie es auf der Seite aus – die Tage passen sich dynamisch an Start- und Enddatum an!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 Tägliche Arbeitszeiterfassung: tatsächlichen Fortschritt verfolgen (optional)

#### 11.4.1 Tabelle für tägliche Arbeitszeiterfassung anlegen

Wir legen eine Tabelle für die tägliche Arbeitszeiterfassung an, um den täglichen Aufgabenfortschritt zu protokollieren. Ergänzen Sie folgende Felder:

- **Tägliche Arbeitszeit** (hours, idealerweise ganzzahlig)
- **Datum**
- **Ideal-Arbeitszeit** (ideal_hours, idealerweise ganzzahlig)
- **Zugehörige Unteraufgabe**: [Viele-zu-Eins](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o)-Beziehung zu Unteraufgaben.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 Tägliche Arbeitszeit auf der Unteraufgaben-Seite anzeigen

Im Bearbeitungsformular der Unteraufgabe stellen Sie die Tabelle für die tägliche Arbeitszeit als [Sub-Tabelle](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table) dar und ordnen die übrigen Felder per Drag-and-Drop. So können Sie tägliche Arbeitszeitdaten direkt auf der Unteraufgaben-Seite eintragen und einsehen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 Wichtige Berechnungen und Verknüpfungsregeln (optional)

Damit sich der Fortschritt und die verbleibende Arbeitszeit präzise schätzen lassen, treffen wir einige zentrale Konfigurationen.

#### 11.5.1 [Pflichtfelder](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required) der Unteraufgaben festlegen

Markieren Sie **Startdatum**, **Enddatum** und **Geschätzte Arbeitszeit** als [Pflichtfelder](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required), damit alle Daten vorhanden sind und die Berechnungen funktionieren.

#### 11.5.2 [Verknüpfungsregeln](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) für Fertigstellungsgrad und verbleibende Arbeitszeit

Fügen Sie in der Unteraufgaben-Tabelle folgende Berechnungsregeln hinzu:

- **Fertigstellungsgrad**: Summe der täglichen Arbeitszeit / Geschätzte Arbeitszeit

```html
SUM(【Aktuelles Formular / Tägliche Arbeitszeit / Tägliche Arbeitszeit】)  /  【Aktuelles Formular / Geschätzte Arbeitszeit】
```

- **Verbleibende Arbeitszeit**: Geschätzte Arbeitszeit – Summe der täglichen Arbeitszeit

```html
【Aktuelles Formular / Geschätzte Arbeitszeit】 - SUM(【Aktuelles Formular / Tägliche Arbeitszeit / Tägliche Arbeitszeit】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- Ebenso konfigurieren wir in den Verknüpfungsregeln der täglichen Arbeitszeit die Ideal-Arbeitszeit:

```html
  【Aktuelles Formular / Geschätzte Arbeitszeit】 / 【Aktuelles Formular / Aufgabendauer】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

So lassen sich Fortschritt und verbleibende Arbeitszeit in Echtzeit berechnen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 Diagramm zum Aufgabenfortschritt erstellen (optional)

#### 11.6.1 Diagramm zum Aufgabenfortschritt erstellen

Legen Sie einen neuen [Diagramm](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)-Block an, um die Veränderungen von **Summe der täglichen Arbeitszeit** und **Summe der Ideal-Arbeitszeit** über die Zeit darzustellen und so den Fortschritt sichtbar zu machen.

Setzen Sie die Bedingung 【Verknüpfte Aufgabe/Id】 gleich 【Aktueller Popup-Datensatz/ID】, damit das Diagramm den realen Stand der aktuellen Aufgabe widerspiegelt.

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 Basisinformationen und Fortschrittsänderungen anzeigen

Erinnern Sie sich an unseren [Markdown-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)? Über einen `markdown`-Block stellen wir Basisinformationen und Fortschritt der Aufgabe dar.

Verwenden Sie [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars), um den Fortschritt in Prozent darzustellen:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

Als Template-Sprache wählen Sie [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars). Details zur Syntax finden Sie in der offiziellen Dokumentation.

---

### 11.7 Zusammenfassung

Glückwunsch! Wir haben die Aufgabenzerlegung in Unteraufgaben abgeschlossen. Mit Mehrebenen-Verwaltung, täglicher Arbeitszeit-Erfassung und Diagrammen sehen wir den Fortschritt klar und können effizienter arbeiten. Vielen Dank fürs geduldige Mitlesen – auf zum [nächsten Kapitel](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking)!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
