# Kapitel 10: Dashboard-Filter und -Bedingungen

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

In diesem Kapitel begleiten wir Sie Schritt für Schritt durch den nächsten Abschnitt des Aufgaben-Dashboards. Bei Fragen können Sie sich jederzeit in unserem Forum melden.

Wir starten mit einer Wiederholung des letzten Kapitels und beginnen unsere Entdeckungsreise.

### 10.1 Auflösung des letzten Kapitels

#### 10.1.1 Status und Links

Zuerst ergänzen wir für alle Status den passenden Link-Sprung, damit man schnell navigieren kann. Hier sind die Linkstrukturen je Status:

(Angenommen unsere URL ist `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`.)

##### Lösung der Bonusaufgabe


| Status<br/>           | Link<br/>                                            |
| --------------------- | ---------------------------------------------------- |
| Nicht begonnen<br/>   | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| In Bearbeitung<br/>   | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>  |
| Zu prüfen<br/>        | hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br> |
| Abgeschlossen<br/>    | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| Abgebrochen<br/>      | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| Archiviert<br/>       | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 Mehrfachauswahl für Verantwortliche hinzufügen

1. **[Eigenes Filterfeld](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5) anlegen**: Wir benötigen ein Feld „Verantwortlich“ als Mehrfachauswahl, das die Spitznamen (oder Benutzernamen) der Mitglieder enthält, damit sich Verantwortliche bei der Aufgabenzuweisung schnell auswählen lassen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **In der Diagrammkonfiguration**: Setzen Sie als Filter „Verantwortlich/Spitzname enthält Aktueller Filter/Verantwortlich“. Damit finden Sie Aufgaben des aktuellen Verantwortlichen schnell.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

Filtern Sie ein paar Mal, um sicherzustellen, dass alles korrekt funktioniert.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 Dashboard mit Benutzern verknüpfen

Wir können je nach Benutzer unterschiedliche Inhalte anzeigen:

1. **Standardwert von „Verantwortlich“ auf „Aktueller Benutzer/Spitzname“ setzen**: So zeigt das System automatisch die Aufgaben des angemeldeten Benutzers und steigert die Effizienz.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **Nach Aktualisierung der Seite**: Das Dashboard lädt automatisch die Daten passend zum angemeldeten Benutzer. (Vergessen Sie nicht, die nötigen Diagramme um den Benutzer-Filter zu ergänzen.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 Aufgabenfilter überarbeiten

Vielleicht ist Ihnen bereits eine unschöne Eigenheit aufgefallen:

Wenn wir „Datenbereich konfigurieren“ direkt im Tabellen-Block für den Sprung verwenden, sind unsere Aufgaben bereits auf den entsprechenden Status eingeschränkt. Filtern wir dann auf einen anderen Status, sind die Daten leer!

Was tun? Entfernen wir den Datenfilter und nutzen wir eine andere Filtermethode!

1. **Datenfilter entfernen**: Damit der Status nicht auf einen Bereich gelockt wird und sich Filter flexibel anpassen lassen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **Standardwerte für den Filter-Block (Formular) konfigurieren**

Erinnern Sie sich noch an unseren [Filter-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)?

Erstellen Sie einen neuen Filter-Block für die Aufgabentabelle und konfigurieren Sie dort **Status** und weitere benötigte Felder, in die wir den URL-Parameter übernehmen. (Vergessen Sie nicht, den zu filternden Aufgaben-Block zu verbinden.)

- Setzen Sie als Standardwert für das Status-Feld `URL search params/task_status`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **Neue Filterfunktion testen**: Sie können den Statusfilter beliebig wechseln und alles bleibt flexibel.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **Optional**: Wenn Sie möchten, dass jeder Benutzer sich auf seine eigenen Aufgaben konzentriert, können Sie auch beim Feld „Verantwortlich“ den Standardwert auf „Aktueller Benutzer“ setzen.

---

### 10.4 News, Mitteilungen, Informationsfokus

Gestalten wir die Dokumentbibliothek noch einmal um und blenden gewünschte Informationen ins Dashboard ein!

In der langfristigen Dokumentverwaltung sammeln sich immer mehr Materialien an. Daraus ergeben sich verschiedene Anforderungen:

- News: Fokus auf Projekt-Updates, Erfolge, Meilensteine.
- Temporäre Ankündigungen/Hinweise.

#### 10.4.1 News-Feed

1. **Feld „News“ hinzufügen**: Ergänzen Sie in der Dokumenttabelle ein Checkbox-Feld „News“, mit dem Sie wichtige Neuigkeiten markieren.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **Dokument auswählen und News markieren**: Wählen Sie einen Beitrag, ergänzen Sie im Bearbeitungsformular das Feld „News“ und aktivieren Sie es.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **„Listen“-Block anlegen**: Legen Sie im Dashboard einen [„Listen“-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) an > wählen Sie die Dokumenttabelle.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

Ziehen Sie ihn nach rechts, zeigen Sie „Erstellungsdatum“ und „Titel“ an, passen Sie die Feldbreiten an und deaktivieren Sie „Titel anzeigen“.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **News anzeigen**:

Damit der Aktualitätscharakter sichtbar wird, blenden wir auch die Zeit ein.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

Sortieren Sie absteigend nach Erstellungsdatum, um die neuesten Beiträge oben zu zeigen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

So entsteht ein einfacher News-Feed – Mitglieder bleiben über die wichtigen Projektneuigkeiten auf dem Laufenden.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 Ankündigungen

Als Nächstes eine einfache öffentliche Ankündigungsfunktion, die Sie aus unserer Online-Demo sicher schon kennen. Bei temporären Mitteilungen wollen wir keine dauerhafte Anzeige und keinen Projektverlauf festhalten – es geht nur um vorübergehende Hinweise.

1. **Neuen [Markdown-Block](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) anlegen**: Wählen Sie eine beliebige Stelle des Dashboards und erstellen Sie die Ankündigung in Markdown.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Praxisnahe Hinweise zu Markdown finden Sie in unserer offiziellen Demo, in der offiziellen Dokumentation oder im [Tutorial „Lightweight Documents“](https://www.nocobase.com/cn/tutorials).

Als einfaches Beispiel zeigt der folgende HTML-Schnipsel „eine schicke Ankündigung“ und demonstriert die Stärken des [Markdown-Blocks](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown).

- Beispielcode:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Wichtige Ankündigung</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Liebe Kolleginnen und Kollegen,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">um die Effizienz weiter zu steigern, führen wir am <span style="color: red; font-weight: bold; font-size: 1.5em;">10. November</span> eine teamweite Schulung durch.</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Vielen Dank für Ihre Mitwirkung!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Beste Grüße,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">das Management-Team</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 Zusammenfassung

Mit den oben gezeigten Schritten haben wir ein personalisiertes Dashboard erstellt, mit dem Teammitglieder Aufgaben effizient verwalten, Projektfortschritte verfolgen und Ankündigungen empfangen können.

Vom Statusfilter über die Konfiguration der Verantwortlichen bis hin zur News-Anzeige – alle Maßnahmen verbessern das Benutzererlebnis und die Flexibilität des Systems.

Damit ist Ihr personalisiertes Dashboard einsatzbereit. Probieren Sie es aus, passen Sie es an Ihre Bedürfnisse an und wir gehen ins [nächste Kapitel](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation)!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
