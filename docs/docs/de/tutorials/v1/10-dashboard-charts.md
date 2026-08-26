# Kapitel 9: Aufgaben-Dashboard und Diagramme

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Endlich erreicht: das lang erwartete Visualisierungs-Kapitel! Hier schauen wir uns an, wie Sie sich aus der Informationsflut auf das Wesentliche konzentrieren können. Als Verantwortliche dürfen wir uns in komplexen Aufgaben nicht verlieren – schauen wir gemeinsam, wie Sie Aufgabenstatistiken und Informationsdarstellung souverän in den Griff bekommen.

### 9.1 Schlüsselinformationen ins Zentrum rücken

Wir möchten den Aufgabenstand des Teams auf einen Blick sehen, eigene oder uns interessierende Aufgaben schnell finden – statt durch eine Masse an Informationen zu suchen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Schauen wir uns zunächst an, wie Sie ein [Diagramm](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) für die Aufgabenstatistik des Teams erstellen.

#### 9.1.1 [Diagrammdaten-Block](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) anlegen

Legen Sie eine neue Seite an (z. B. „Persönliches Dashboard“):

1. Erstellen Sie einen neuen Diagrammdaten-Block. (In diesem großen Block lassen sich viele Datendiagramme unterbringen.)
2. Wählen Sie im Diagramm-Block unser Ziel: die Aufgabentabelle. Wechseln Sie in die Diagrammkonfiguration.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Statusstatistik konfigurieren

Wenn wir Aufgaben nach Status zählen möchten, was tun wir? Zunächst die Daten vorbereiten:

- Maß: Wählen Sie ein eindeutiges Feld zum Zählen, etwa das ID-Feld.
- Dimension: Verwenden Sie den Status zur Gruppierung.

Anschließend folgt die Diagrammkonfiguration:

1. Wählen Sie ein [Säulendiagramm](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) oder [Balkendiagramm](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. X-Achse: Status, Y-Achse: ID. Vergessen Sie nicht, das Kategoriefeld „Status“ zu wählen! (Andernfalls werden die Farben im Diagramm nicht differenziert.)

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Statistik mit mehreren Dimensionen: Aufgabenanzahl je Person

Wenn wir die Anzahl pro Person und Status statistisch erfassen wollen, ergänzen wir eine zweite Dimension – „Verantwortlich/Spitzname“.

1. Klicken Sie oben links auf „Abfrage ausführen“.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. Das Diagramm wirkt vielleicht ungewohnt. Kein Problem – wählen Sie „Gruppieren“, um die Verantwortlichen einander gegenüberzustellen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Wenn Sie die Gesamtmenge gestapelt darstellen möchten, wählen Sie „Stapeln“. So sehen Sie für jeden Verantwortlichen den Anteil an den Gesamtaufgaben.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Datenfilter und dynamische Anzeige

#### 9.2.1 Datenfilter konfigurieren

Selbstverständlich können wir auch die Status „Abgebrochen“ und „Archiviert“ herausfiltern – dazu deaktivieren Sie diese im linken Filterbereich. Sie kennen diese Bedingungen sicher schon.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

Nach dem Filtern bestätigen Sie, schließen die Konfiguration und das erste Diagramm der Seite ist fertig.

#### 9.2.2 [Diagramm kopieren](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

Sie möchten gleichzeitig „Gruppieren“ und „Stapeln“ darstellen, ohne neu zu konfigurieren?

- Klicken Sie oben rechts beim ersten Diagramm-Block auf „Kopieren“.
- Scrollen Sie nach unten – dort steht das zweite Diagramm. Ziehen Sie es nach rechts, entfernen Sie die „Stapeln“-Konfiguration und stellen Sie auf „Gruppieren“ um.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 Dynamische [Filter](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)

Können wir auch dynamisch nach unterschiedlichen Bedingungen [filtern](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)?

Selbstverständlich! Aktivieren Sie unten im Diagrammdaten-Block „Filter“; oben erscheint das Filterfeld. Zeigen Sie die gewünschten Felder an und definieren Sie deren Filterbedingungen. (Beispiel: Datumsfeld auf „Zwischen“ setzen.)

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Eigene Filterfelder anlegen

Was, wenn wir in Sonderfällen auch „Abgebrochen“ und „Archiviert“ einbeziehen wollen, mit dynamischer Filterung und Standardwerten?

Legen wir ein [eigenes Filterfeld](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5) an!

> Eigenes Filterfeld: Sie können Felder aus verknüpften Datentabellen oder eigene Felder verwenden (nur in Diagrammen verfügbar).
>
> Sie können Titel, Beschreibung und Filteroperator des Felds bearbeiten und Standardwerte (z. B. aktueller Benutzer oder Datum) festlegen, damit Filter besser zu Ihrem Anwendungsfall passen.

1. Titel: „Status“ eintragen.
2. Quellfeld leer lassen.
3. Komponente: „Checkbox“ wählen.
4. Optionen entsprechend der Statusattribute aus der Datenbank eintragen (Reihenfolge: Optionsbeschriftung – Optionswert).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

Erstellung erfolgreich. Klicken Sie auf „Standardwert festlegen“ und wählen Sie die gewünschten Optionen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

Nach dem Standardwert kehren Sie in die Diagrammkonfiguration zurück und ändern den Filter zu „Status – enthält irgendeinen – Aktueller Filter/Status“. Bestätigen. (Beide Diagramme anpassen!)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

Erledigt – ein Filtertest zeigt: Die Daten werden perfekt angezeigt.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Dynamische Links und Aufgabenfilter

Als Nächstes setzen wir eine sehr praktische Funktion um: Beim Klick auf eine Statistikzahl springt das System direkt zum gefilterten Aufgaben-Bereich. Dafür legen wir zunächst Statistikdiagramme für die einzelnen Statuswerte an und platzieren sie ganz oben.

#### 9.3.1 Beispiel „Nicht begonnen“: [Statistikdiagramm](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic) anlegen

1. Maß: ID-Anzahl.
2. Filter: Status gleich „Nicht begonnen“.
3. Containername: „Nicht begonnen“, Typ: „Statistik“, Diagrammname leer lassen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

Die Statistik für „Nicht begonnen“ wird erfolgreich angezeigt. Kopieren Sie den Block für die fünf weiteren Status und ziehen Sie sie nach oben.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Verlinkung mit Filter konfigurieren

1. Wechseln Sie zur Seite mit dem Aufgaben-Tabellen-Block und sehen Sie sich die URL-Struktur in der Adresszeile an (typischerweise so: `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Angenommen `xxxxxxxxx` ist Ihre Domain und `/admin/0z9e0um1vcn` der Pfad. (Wir suchen das letzte `/admin`.)
2. Teil der URL kopieren

   - Wir möchten einen Sprung über einen Link auslösen. Dafür extrahieren wir einen Teil aus der URL.
   - Beginnen Sie hinter `admin/` (ohne `admin/` selbst) und kopieren Sie bis zum Ende. Im Beispiel kopieren wir: `0z9e0um1vcn`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

Beim Hover über „Nicht begonnen“ verändert sich der Mauszeiger zur Hand. Klicken Sie – der Sprung gelingt.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Diagramm-Link konfigurieren
   Ergänzen wir die URL um einen Filter-Parameter. Erinnern Sie sich an die Datenbank-Kennung des Status? Wir hängen sie ans Ende der URL an, um die Aufgaben weiter zu filtern.
   - Hängen Sie an die URL `?task_status=Not started` an, sodass die URL so aussieht: `0z9e0um1vcn?task_status=Not started`.
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Format-Regeln für URL-Parameter:
> Beim Hinzufügen von Parametern gibt es ein paar Regeln:
>
> - **Fragezeichen (?)**: Markiert den Beginn der Parameter.
> - **Parametername und -wert**: Im Format `name=wert`.
> - **Mehrere Parameter**: Werden mit `&` verbunden, z. B.:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Hier ist `user` ein weiterer Parameter mit dem Wert `123`.

4. Zurück auf der Seite klicken Sie auf den Sprung – Erfolg, der gewünschte Parameter steht in der URL.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [URL-Filter-Bedingungen verknüpfen](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

Die Tabelle reagiert noch nicht? Keine Sorge – ein letzter Schritt fehlt.

- Öffnen Sie die Konfiguration des Tabellen-Blocks und klicken Sie auf „Datenbereich konfigurieren“.
- Wählen Sie: „Status“ gleich „URL-Suchparameter/status“.

Bestätigen – der Filter funktioniert!

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Datenvisualisierung](https://docs-cn.nocobase.com/handbook/data-visualization): beeindruckende Diagramme

> Datenvisualisierung: [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (kommerzielles Plugin, kostenpflichtig).
> ECharts bietet vielfältige, individualisierbare Konfigurationen, etwa „[Liniendiagramm](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line) (mehrdimensional)“, „[Radardiagramm](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)“, „[Wortwolke](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)“…

Wenn Sie weitere Diagrammkonfigurationen wünschen, aktivieren Sie den Block „Datenvisualisierung: ECharts“.

#### 9.4.1 Schnell ein eindrucksvolles [Radardiagramm](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar) konfigurieren

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Falls Daten verdeckt werden, passen Sie Größe oder Radius an, damit alles gut sichtbar ist.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

Ziehen Sie das Diagramm anschließend an die gewünschte Position – fertig!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Weitere Diagrammcontainer

Hier warten weitere Diagramme auf Sie.

##### [Wortwolke](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Trichterdiagramm](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Mehrere Kennzahlen (Doppelachsendiagramm, ECharts-Liniendiagramm)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

Beim Doppelachsendiagramm können Sie mehrere Kennzahlen ergänzen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Vergleichsbalkendiagramm](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Kleine Bonusaufgabe

Bevor wir das Kapitel abschließen, hier eine kleine Bonusaufgabe:

1. Ergänzen Sie auch für die übrigen Status **In Bearbeitung, Zu prüfen, Abgeschlossen, Abgebrochen, Archiviert** die URL-Parameter, damit alle Diagramme den passenden Filter-Sprung auslösen.
2. Konfigurieren Sie ein Mehrfachauswahlfeld „Verantwortlich“ wie zuvor das Status-Mehrfachauswahlfeld; setzen Sie als Standardwert den Spitznamen des aktuellen Benutzers.

Im [nächsten Kapitel](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) setzen wir das Dashboard fort – wir freuen uns auf das nächste Treffen!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
