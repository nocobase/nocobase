# Kapitel 4: Aufgaben- und Kommentar-Plugins

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113532393752067&bvid=BV16XB2YqERC&cid=26937593203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe

## Rückblick auf den letzten Abschnitt

Erinnern Sie sich noch an die Bonusaufgabe aus dem letzten Kapitel? Wir wollten die Aufgabentabelle um die Felder **Status** und **Anhang** ergänzen und in der Aufgabenliste anzeigen. Schauen wir uns die Lösung an!

1. **Statusfeld konfigurieren**:
   - Wählen Sie das Feld [**Dropdown (Einzelauswahl)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) und legen Sie die Optionsbeschriftungen fest: **Nicht begonnen, In Bearbeitung, Zu prüfen, Abgeschlossen, Abgebrochen, Archiviert**. Die Farben können Sie nach Belieben wählen – verleihen Sie Ihren Aufgaben etwas Farbe!

![Statusfeld konfigurieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162341275.png)

2. **Anhang-Feld konfigurieren**:
   - Legen Sie ein Feld [**Anhang**](https://docs-cn.nocobase.com/handbook/file-manager/field-attachment) an, geben Sie ihm einen Namen, etwa „Anhang“, und klicken Sie auf „Senden“. Fertig.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162343470.png)

3. **In der Aufgabenliste „Erstellt von“ und Status anzeigen**:
   - Aktivieren Sie im Tabellen-Block die Felder „Erstellt von“, „Status“ und „Anhang“, damit die Aufgabenliste mehr wichtige Informationen enthält.

![Felder in der Aufgabenliste anzeigen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162344570.png)

4. **Felder in den Hinzufügen- und Bearbeiten-Formularen anzeigen**:
   - Aktivieren Sie auch im Popup-Formular die Felder Status und Anhang, damit diese Felder beim Anlegen und Bearbeiten von Aufgaben jederzeit verfügbar sind.

![Felder im Formular anzeigen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162345053.gif)

Gut gemacht! Wiederholen Sie diese Schritte ein paar Mal – mit jeder Wiederholung wird Ihnen die Kernbedienung von NocoBase vertrauter. Jeder Klick legt das Fundament für Ihre spätere Aufgabenverwaltung. Weiter geht es!

---

## 4.1 Aufgabeninhalte und Kommentare: Interaktion in der Aufgabenverwaltung

Bisher kann Ihr Aufgabenverwaltungssystem die grundlegenden Aufgabeninformationen abbilden. Aufgabenverwaltung ist allerdings mehr als nur ein paar Zeilen Text – manchmal brauchen wir reichhaltigere Inhalte und Echtzeit-Interaktion zwischen Teammitgliedern.

### 4.1.1 Markdown (Vditor): Mehr Möglichkeiten für Aufgabeninhalte

Sie haben sicher bemerkt, dass NocoBase einen [**Rich-Text**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/rich-text)- und einen [**Markdown**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/markdown)-Editor anbietet. Diese sind allerdings möglicherweise noch nicht ganz ausreichend.
Der Rich-Text-Editor ist funktional eher begrenzt, der Markdown-Editor ist hilfreich, unterstützt jedoch keine Echtzeit-Vorschau.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162346447.png)

Gibt es einen Editor, der Echtzeit-Vorschau und einen größeren Funktionsumfang bietet? Auf jeden Fall! [**Markdown (Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor) ist der leistungsfähigste Texteditor in NocoBase, unterstützt Echtzeit-Vorschau, Bild-Upload und sogar Sprachaufzeichnung. Außerdem ist er bereits im System integriert und vollständig kostenlos!

> **Plugins kurz erklärt:** Plugins sind eine der Kernfunktionen von NocoBase. Sie ermöglichen es, projektspezifische Funktionen oder Drittanbieter-Integrationen hinzuzufügen.
> Über Plugin-Erweiterungen lassen sich praktische oder unerwartete Funktionsintegrationen umsetzen, was Ihre Gestaltung und Entwicklung deutlich erleichtert.

Im Folgenden zeige ich Ihnen Schritt für Schritt, wie Sie diesen leistungsfähigen Editor aktivieren – Sie ahnen es: er findet sich im Plugin-Manager.

> **Markdown (Vditor)**: Speichert Markdown und rendert über den Vditor-Editor. Unterstützt gängige Markdown-Syntax wie Listen, Code, Zitate usw. sowie Bild-Upload, Sprachaufnahmen u. v. m. Bietet zudem ein WYSIWYG-Erlebnis dank Echtzeit-Rendering.

1. **Plugin „Markdown (Vditor)“ aktivieren**:
   - Öffnen Sie oben rechts den **Plugin-Manager**, suchen Sie nach „markdown“ und aktivieren Sie [**Markdown (Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor). Lassen Sie sich nicht davon irritieren, wenn die Seite kurz aktualisiert wird – nach wenigen Sekunden ist alles wieder normal.

![Markdown-Plugin aktivieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162348237.png)

2. **Markdown-Feld anlegen**:

   - Wechseln Sie in die Aufgabentabelle und klicken Sie auf „Feld erstellen“ – die Markdown-Pro-Plus-Variante steht jetzt zur Verfügung!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162349275.png)

- Geben Sie ihr einen Namen, etwa „Aufgabendetails (task_detail)“, und aktivieren Sie alle verfügbaren Funktionen.

3. Sie sehen vielleicht die Option „Datei-Tabelle“. Hat es Auswirkungen, wenn Sie sie nicht auswählen? Keine Sorge: Ihre Dateien werden im Standard-Speicherbereich abgelegt – nutzen Sie das Feld unbesorgt.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162350389.gif)

4. **Markdown-Feld testen**:
   - Kehren Sie zur Aufgabenverwaltungsseite zurück und schreiben Sie Ihren ersten Markdown-Text! Probieren Sie auch das Einfügen von Bildern oder das Hochladen von Dateien aus – beeindruckend, oder?

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162351380.gif)

Die Aufgabentabelle wird immer reichhaltiger! Mit jedem Schritt erweitert sich Ihr System. Schauen wir uns nun an, wie wir die Felder neu anordnen, damit die Oberfläche aufgeräumter wirkt.

### 4.1.2 Felder neu anordnen

Wenn die Aufgabentabelle viele Felder hat, kann das Layout schnell unübersichtlich wirken. Keine Sorge: Dank der Flexibilität von NocoBase lassen sich Felder mühelos neu anordnen.

**Feldposition anpassen**:

- Bewegen Sie den Mauszeiger über das Kreuz-Symbol oben rechts an einem Feld, klicken Sie es an und ziehen Sie es an die gewünschte Stelle. Lassen Sie los – fertig. Die Seite wirkt sofort aufgeräumter!

![Feldposition anpassen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162352077.gif)

So passt das Layout besser zu Ihren Anforderungen. Als Nächstes ergänzen wir die Aufgabentabelle um eine Kommentarfunktion, damit die Zusammenarbeit im Team einfacher wird.

## 4.2 Kommentarfunktion

Allein die Aufgabenbeschreibung reicht oft nicht. Manchmal sollen Teammitglieder Kommentare zu einer Aufgabe hinzufügen, Probleme diskutieren oder Feedback festhalten können. Legen wir los.

### 4.2.1 Methode 1: Kommentar-Plugin verwenden

#### 4.2.1.1 Kommentar-Plugin installieren

> **Kommentar-Plugin (kommerzielles Plugin):** Stellt eine Vorlage für eine Kommentar-Datentabelle und einen Block bereit, mit dem Sie für beliebige Datentabellen Kommentarfunktionen ergänzen können.
>
> Hinweis: Wenn Sie Kommentare hinzufügen, muss die Ziel-Datentabelle über ein Beziehungsfeld verknüpft werden, um Konflikte zu vermeiden.

Laden Sie im [**Plugin-Manager**](https://docs-cn.nocobase.com/handbook/plugin-manager) das **Kommentar-Plugin** hoch und aktivieren Sie es. Nach der Aktivierung erscheint in der Datenquelle eine neue Option „Kommentartabelle“.
Klicken Sie auf Hinzufügen > Plugin hochladen > Archivdatei hineinziehen > Senden.
Suchen Sie nach „Kommentar“ – das Kommentar-Plugin erscheint! Aktivieren Sie es, gehen Sie zur Datenquelle, und Sie sehen die Option für die Kommentartabelle. Installation erfolgreich!

![Kommentar-Plugin installieren](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162353550.gif)

#### 4.2.1.2 Neue Kommentartabelle anlegen

Wechseln Sie zur Datenquelle und legen Sie die Kommentar-Datentabelle **Kommentartabelle (Comments)** an.

#### 4.2.1.3 Beziehung zwischen Kommentar- und Aufgabentabelle

Wir haben nun die **Kommentartabelle (Comments)** angelegt. Vielleicht denken Sie: Können wir jetzt direkt den Kommentarbereich auf einer Seite zeichnen? Nicht so schnell! Überlegen wir zunächst: **Jede Aufgabe hat ihren eigenen Kommentarbereich**, und Kommentare gehören jeweils zu einer Aufgabe – das ist eine **Viele-zu-Eins**-Beziehung. Aber wie verknüpfen wir Kommentare und Aufgaben?

**Genau! Hier kommt das [„Beziehungsfeld“](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations) ins Spiel.**

NocoBase erlaubt es uns, mit Beziehungsfeldern Tabellen wie über Brücken miteinander zu verbinden, sodass zusammengehörige Daten enger verzahnt sind.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162355370.gif)

**Warum eine Viele-zu-Eins-Beziehung?**

Warum wählen wir eine [**Viele-zu-Eins**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o)-Beziehung und keine [**Eins-zu-Viele**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/o2m)-Beziehung oder eine andere Art? Bedenken Sie: **Eine Aufgabe hat mehrere Kommentare**, also können mehrere Kommentare auf dieselbe Aufgabe verweisen. In diesem Fall benötigen wir in der Kommentartabelle ein **Viele-zu-Eins**-Feld, das auf die Aufgabe in der Aufgabentabelle zeigt.

> Vielleicht denken Sie schon weiter:
> Wenn Kommentare und Aufgaben in einer Viele-zu-Eins-Beziehung stehen, könnten wir doch in der Aufgabentabelle ein **Eins-zu-Viele**-Feld anlegen, das auf die Kommentartabelle zeigt?
> **Genau richtig!** Eins-zu-Viele und Viele-zu-Eins sind zwei Seiten derselben Medaille. Wir können in der Aufgabentabelle ebenso ein Eins-zu-Viele-Feld anlegen, das mit der Kommentartabelle verknüpft ist. Bestens gemacht!

#### 4.2.1.4 Viele-zu-Eins-Beziehungsfeld einrichten

Als Nächstes erstellen wir in der Kommentartabelle ein Viele-zu-Eins-Feld, das mit der Aufgabentabelle verknüpft ist. Wir nennen das Feld **Zugehörige Aufgabe (belong_task)**. Bei der Konfiguration sind einige Punkte zu beachten:

1. **Quelldatentabelle**: Von welcher Tabelle aus initiieren wir die Beziehung? Hier wählen wir die **Kommentartabelle**.
2. **Zieldatentabelle**: Mit welcher Tabelle möchten wir verknüpfen? Hier wählen wir die **Aufgabentabelle**.

> **Foreign Key und Feld-Kennung der Zieldatentabelle – ein Beispiel:**
> Jetzt kommt der entscheidende Teil: **Foreign Key** und **Feld-Kennung der Zieldatentabelle**.
> Klingt etwas komplex? Keine Sorge, ein ausführliches Beispiel macht es leicht verständlich.
>
> **Stellen Sie sich vor**, Sie haben viele Zeugnisse einer Hochschulreifeprüfung in der Hand und möchten zu jedem Zeugnis den richtigen Schüler finden. Wie machen Sie das?
> Auf einem Zeugnis stehen folgende Angaben:
>
> - **Name**: Zhang San
> - **Klasse**: Klasse 15, Jahrgang 12
> - **Prüfungs-ID**: 202300000001
> - **Personalausweisnummer**: 111111111111
>   Nehmen wir an, Sie wollen über **Name** und **Klasse** den Schüler Zhang San finden. Doch da kommt das Problem: An einer Schule gibt es viele gleichnamige Schüler, allein in Klasse 15 sind **20 Schüler namens Zhang San**! Mit Name und Klasse allein lässt sich also nicht eindeutig sagen, welcher Zhang San gemeint ist.
>   **Wir benötigen eine eindeutige Kennzeichnung**. Die **Prüfungs-ID** ist dafür hervorragend geeignet, denn jede Prüfungs-ID ist einzigartig. Über die Prüfungs-ID lässt sich der Schüler zum Zeugnis exakt bestimmen. Schicken Sie also die Anfrage mit der Prüfungs-ID 202300000001 ab, kommt kurz darauf die Antwort: „Dieses Zeugnis gehört Zhang San, Klasse 15, dritte Reihe, der mit der Brille!“
>   **Genauso** verhält es sich beim Beziehungsentwurf für die **Kommentare**: Vielleicht haben Sie schon eine Idee – wir wählen ein eindeutiges Feld der Aufgabentabelle (z. B. **id**) und speichern es in jedem Kommentar, um zu wissen, zu welcher Aufgabe der Kommentar gehört.
>   Genau das ist das Kernkonzept einer Viele-zu-Eins-Beziehung: der **Foreign Key**. Ganz einfach, oder?

In der Kommentartabelle speichern wir die eindeutige id der Aufgabe – wir nennen sie **task_id** – und können so über task_id Kommentare und Aufgaben verbinden.

#### 4.2.1.5 Strategien für den Foreign Key beim Löschen

In NocoBase müssen Sie nach Einrichten einer Viele-zu-Eins-Beziehung festlegen, wie sich die Kommentare verhalten, wenn die zugehörige Aufgabe gelöscht wird. Sie haben mehrere Möglichkeiten:

- **CASCADE**: Beim Löschen der Aufgabe werden auch alle zugehörigen Kommentare gelöscht.
- **SET NULL** (Standard): Die Aufgabe wird gelöscht, die Kommentare bleiben erhalten, das Foreign-Key-Feld wird jedoch geleert.
- **RESTRICT** und **NO ACTION**: Wenn die Aufgabe noch zugeordnete Kommentare hat, verhindert das System das Löschen, damit keine Kommentare verloren gehen.

#### 4.2.1.7 Reverse-Beziehung in der Aufgabentabelle anlegen

Aktivieren Sie schließlich die Option „**In der Zieldatentabelle ein Reverse-Beziehungsfeld erstellen**“, damit wir aus einer Aufgabe heraus alle zugehörigen Kommentare einsehen können. Das macht die Datenverwaltung deutlich komfortabler.

In NocoBase entscheidet die Lage des Beziehungsfelds darüber, wie die Daten abgerufen werden. Wenn wir in der Aufgabentabelle die zugehörigen Kommentare einsehen möchten, benötigen wir dort ein **Eins-zu-Viele**-Feld als Reverse-Beziehung zur Kommentartabelle.

Beim erneuten Öffnen der Aufgabentabelle sehen Sie dann automatisch ein verknüpftes Kommentar-Feld mit dem Hinweis „**Eins-zu-Viele**“. Damit können Sie alle zugehörigen Kommentare bequem ansehen und verwalten!

## 4.3 Seitengestaltung

### 4.3.1 Kommentar-Tabelle aktivieren

Spannender Moment: Wir kehren zum Bearbeiten-Popup zurück, erstellen einen Block für die Kommentartabelle und aktivieren dabei die benötigten Funktionen. Erledigt!

![demov3N-16.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162357118.gif)

### 4.3.2 Seite anpassen

Verschönern wir das Layout: Bewegen Sie den Mauszeiger oben rechts neben die Bearbeiten-Schaltfläche und wählen Sie ein breiteres Popup. Mit dem zuvor Gelernten ziehen Sie den Kommentar-Block auf die rechte Seite des Popups – perfekt!

![demov3N-17.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162358300.gif)

Vielleicht denken Sie jetzt: Ich möchte auch Kommentare umsetzen, ohne das kostenpflichtige Plugin! Keine Sorge, ich habe eine zweite, kostenfreie Variante für Sie.

### 4.2.2 Methode 2: Eigene Kommentartabelle

Wenn Sie das Kommentar-Plugin nicht erworben haben, können Sie eine ähnliche Kommentarfunktion mit einer normalen Tabelle umsetzen.

1. **Neue Kommentartabelle**:

   - Legen Sie die **Kommentartabelle (comments2)** an, ergänzen Sie das Feld **Kommentarinhalt (content)** (Markdown-Typ) und das Feld **Zugehörige Aufgabe (belong_task)** (Viele-zu-Eins).
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170001040.gif)
2. **Block für die Kommentarliste auf der Seite anlegen**:

   - Fügen Sie im Bearbeiten-Popup der Aufgabentabelle einen [**Listen-Block**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) hinzu (das ist der dritte Blocktyp – Listen können auch Felddetails anzeigen). Wählen Sie die Kommentartabelle aus und testen Sie:
     ![Block für Kommentarliste anlegen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170003544.gif)

## Zusammenfassung

Sie haben gelernt, wie Sie mit Markdown (Vditor) Aufgabeninhalte aufwerten und Aufgaben um eine Kommentarfunktion erweitern! Damit hat Ihr Aufgabenverwaltungssystem eine vollständige funktionale Grundlage und Sie sind dem Ziel, ein professionelles Aufgaben-Tool zu bauen, ein gutes Stück näher gekommen.

Erkunden Sie weiter und probieren Sie aus – NocoBase steckt voller Möglichkeiten. Bei Problemen lassen wir Sie nicht alleine, wir gehen jeden Schritt mit Ihnen.

[Im nächsten Kapitel (Kapitel 5: Tabs & Blocks – Vielfältige Ansichten, brillanter Auftritt)](https://www.nocobase.com/cn/tutorials/task-tutorial-tabs-blocks) erkunden wir weitere Block-Funktionen von NocoBase und heben Ihr System auf eine neue Stufe. Bleiben Sie dran!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
