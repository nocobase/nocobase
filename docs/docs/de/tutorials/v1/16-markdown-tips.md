# Markdown-Block-Tipps

Der Markdown-Block ist einer der am häufigsten genutzten und vielseitigsten Blöcke. Er reicht von einfachen Texthinweisen über schlichtes HTML-Styling bis hin zur Übernahme wichtiger Geschäftslogik - flexibel und vielseitig.

## I. Grundfunktionen des Markdown-Blocks

Da Markdown-Blöcke flexibel, sichtbar und jederzeit änderbar sind, eignen sie sich hervorragend für Systemankündigungen. Ob Modul, Funktion, Block oder Feld - überall können Sie wie kleine Klebezettel praktische Hinweise platzieren.

Bevor Sie den Markdown-Block nutzen, empfehlen wir, sich mit Markdown-Layout und -Syntax vertraut zu machen. Eine Referenz finden Sie im [Vditor-Beispiel](https://docs.nocobase.com/api/field/markdown-vditor).

> Hinweis: Der Markdown-Block in Seiten ist relativ schlank, einige Funktionen (mathematische Formeln, Mindmaps usw.) werden derzeit nicht gerendert. Sie können sie jedoch mit HTML umsetzen. Im System steht zudem das Vditor-Feld zur Verfügung - probieren Sie es gerne aus.

### 1.1 Beispielseiten

In den Demo-Seiten unseres Systems sehen Sie Markdown im Einsatz, etwa auf Startseite, Bestellseite und „Weitere Beispiele".

Hinweise und Warnungen auf der Startseite:
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

Berechnungslogik im Bestellmodul:
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Anleitungen und Bilder unter „Weitere Beispiele":
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

Mit dem Wechsel in den Bearbeitungsmodus können Sie Markdown-Inhalte jederzeit anpassen und Veränderungen sofort sehen.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Markdown-Block erstellen

Markdown-Blöcke können flexibel auf Seiten, in Popups und Formularen erstellt werden.

#### Anlagewege

- **In Popup/Seite anlegen:**

  ![Markdown-Block in Popup/Seite](https://static-docs.nocobase.com/20250227091156.png)
- **In einem Formularblock anlegen:**

  ![Markdown-Block im Formular](https://static-docs.nocobase.com/20250227091309.png)

#### Anwendungsbeispiele

Mit Markdown-Syntax lässt sich z. B. mit `---` eine Trennlinie erzeugen, um Inhalte einfach zu strukturieren:

![Trenner Beispiel 1](https://static-docs.nocobase.com/20250227092156.png)
![Trenner Beispiel 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Personalisierte Inhalte

Eine weitere Stärke des Markdown-Blocks ist die Unterstützung von Systemvariablen. So können Sie personalisierte Titel und Hinweise generieren - jeder Benutzer sieht in seinem Formular einzigartige Informationen.

![Personalisierung 1](https://static-docs.nocobase.com/20250227092400.png)
![Personalisierung 2](https://static-docs.nocobase.com/20250227092430.png)

Außerdem können Sie Formulardaten in einfache Layouts integrieren:

**Hervorgehobene Überschrift:**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Resultat hervorgehobene Überschrift](https://static-docs.nocobase.com/20250227164055.png)

**Zentrierte Trennlinie:**

![Zentrierte Felder](https://static-docs.nocobase.com/20250227164456.png)

## III. Reichhaltige Inhalte einfügen

Sobald Sie Markdown-Syntax und Variablen beherrschen, können Sie noch reichhaltigere Inhalte einbinden, etwa HTML.

### 3.1 HTML-Beispiel

Wenn Sie noch keine HTML-Erfahrung haben, lassen Sie sich z. B. von Deepseek beim Schreiben helfen (beachten Sie: `script`-Tags werden nicht unterstützt; alle Stile sollten in lokale `div`-Elemente eingebettet werden).

Hier ein eindrucksvolles Ankündigungsbeispiel:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 Animationsbeispiel

Mit CSS lassen sich auch einfache Animationseffekte realisieren - vergleichbar mit ein- und ausgeblendeten Folien (kopieren Sie den folgenden Code in einen Markdown-Block und probieren Sie es aus!):

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
