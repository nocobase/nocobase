:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/features/built-in-employee).
:::

# Integrierte AI-Mitarbeiter

NocoBase verfügt über mehrere integrierte AI-Mitarbeiter, die für spezifische Szenarien optimiert sind.

Sie müssen lediglich den LLM-Dienst konfigurieren und den entsprechenden Mitarbeiter aktivieren, um mit der Arbeit zu beginnen. Die Modelle können innerhalb der Konversation nach Bedarf gewechselt werden.


## Einführung

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Name des Mitarbeiters | Rollenpositionierung | Kernkompetenzen |
| :--- | :--- | :--- |
| **Cole** | NocoBase-Assistent | Produkt-Fragen & Antworten, Dokumentenabfrage |
| **Ellis** | E-Mail-Experte | E-Mail-Erstellung, Generierung von Zusammenfassungen, Antwortvorschläge |
| **Dex** | Datenorganisator | Feldübersetzung, Formatierung, Informationsextraktion |
| **Viz** | Insight-Analyst | Dateneinblicke, Trendanalysen, Interpretation von Kennzahlen |
| **Lexi** | Übersetzungsassistent | Mehrsprachige Übersetzung, Kommunikationshilfe |
| **Vera** | Forschungsanalyst | Web-Suche, Informationsaggregation, Tiefenforschung |
| **Dara** | Datenvisualisierungsexperte | Diagrammkonfiguration, Erstellung visueller Berichte |
| **Orin** | Datenmodellierungsexperte | Unterstützung beim Entwurf von Sammlungsstrukturen, Feldvorschläge |
| **Nathan** | Frontend-Ingenieur | Unterstützung beim Schreiben von Frontend-Code-Snippets, Stilanpassungen |


Sie können auf der Anwendungsoberfläche auf den **AI-Schwebeknopf** unten rechts klicken und den gewünschten Mitarbeiter auswählen, um die Zusammenarbeit zu starten.


## AI-Mitarbeiter für exklusive Szenarien

Einige integrierte AI-Mitarbeiter (Konstruktionstypen) erscheinen nicht in der AI-Mitarbeiterliste unten rechts. Sie verfügen über exklusive Arbeitsbereiche, zum Beispiel:

* Orin erscheint nur auf der Datenquellen-Konfigurationsseite;
* Dara erscheint nur auf der Diagramm-Konfigurationsseite;
* Nathan erscheint nur im JS-Editor.



---

Im Folgenden finden Sie einige typische Anwendungsszenarien für AI-Mitarbeiter, um Ihnen Inspiration zu bieten. Weiteres Potenzial wartet auf Ihre Erkundung in Ihren tatsächlichen Geschäftsszenarien.


## Viz: Insight-Analyst

### Einführung

> Diagramme und Einblicke mit einem Klick generieren – lassen Sie die Daten für sich selbst sprechen.

**Viz** ist der integrierte **AI-Insight-Analyst**.
Er versteht es, die Daten auf Ihrer aktuellen Seite zu lesen (wie Leads, Opportunities, Accounts) und automatisch Trenddiagramme, Vergleichsdiagramme, KPI-Karten und prägnante Schlussfolgerungen zu generieren, was die Geschäftsanalyse einfach und intuitiv macht.

> Möchten Sie wissen: „Warum sind die Umsätze in letzter Zeit gesunken?“
> Sagen Sie Viz einfach ein Wort, und er kann Ihnen sagen, wo der Rückgang stattgefunden hat, was die möglichen Gründe sind und wie die nächsten Schritte aussehen könnten.

### Anwendungsszenarien

Ob monatliche Geschäftsüberprüfungen, Kanal-ROI oder Verkaufstrichter – Sie können Viz analysieren lassen, Diagramme erstellen und Ergebnisse interpretieren.

| Szenario       | Was Sie wissen möchten      | Output von Viz             |
| -------- | ------------ | ------------------- |
| **Monatliche Überprüfung** | Was lief diesen Monat besser als im letzten? | KPI-Karte + Trenddiagramm + Drei Verbesserungsvorschläge |
| **Wachstumsanalyse** | Wird das Umsatzwachstum durch Volumen oder Preis getrieben? | Faktorenzerlegungsdiagramm + Vergleichstabelle |
| **Kanalanalyse** | Welcher Kanal verdient weitere Investitionen? | ROI-Diagramm + Bindungskurve + Vorschläge |
| **Trichteranalyse** | Wo bleibt der Traffic stecken? | Trichterdiagramm + Erklärung der Engpässe |
| **Kundenbindung** | Welche Kunden sind am wertvollsten? | RFM-Segmentierungsdiagramm + Bindungskurve |
| **Aktionsbewertung** | Wie effektiv war die große Werbeaktion? | Vergleichsdiagramm + Preiselastizitätsanalyse |

### Nutzung

**Seiteneinstiegspunkte**

* **Schaltfläche oben rechts (Empfohlen)**
  
  Klicken Sie auf Seiten wie Leads, Opportunities und Accounts oben rechts auf das **Viz-Symbol**, um vordefinierte Aufgaben auszuwählen, wie:

  * Phasenkonvertierung und Trends
  * Quellkanalvergleich
  * Monatliche Überprüfungsanalyse

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Globales Panel unten rechts**
  
  Auf jeder Seite können Sie das globale AI-Panel aufrufen und direkt mit Viz sprechen:

  ```
  Analyse der Umsatzveränderungen der letzten 90 Tage
  ```

  Viz wird automatisch den Datenkontext Ihrer aktuellen Seite einbeziehen.

**Interaktion**

Viz unterstützt Fragen in natürlicher Sprache und versteht mehrstufige Nachfragen.
Beispiel:

```
Hi Viz, erstelle Lead-Trends für diesen Monat.
```

```
Zeige nur die Leistung von Drittanbieter-Kanälen.
```

```
Welche Region wächst am schnellsten?
```

Jede Folgefrage vertieft die vorherigen Analyseergebnisse, ohne dass Datenbedingungen erneut eingegeben werden müssen.

### Tipps für den Chat mit Viz

| Methode         | Effekt                  |
| ---------- | ------------------- |
| Zeitraum angeben   | „Letzte 30 Tage“ oder „Letzter Monat vs. dieser Monat“ ist genauer |
| Dimensionen angeben | „Ansicht nach Region/Kanal/Produkt“ hilft bei der Perspektivausrichtung |
| Auf Trends statt Details konzentrieren | Viz ist gut darin, die Richtung von Veränderungen und Hauptgründe zu identifizieren |
| Natürliche Sprache verwenden | Keine imperative Syntax erforderlich, stellen Sie Fragen einfach wie in einem Chat |


---



## Dex: Datenorganisator

### Einführung

> Formulare schnell extrahieren und ausfüllen – unordentliche Informationen in strukturierte Daten verwandeln.

`Dex` ist ein Experte für die Datenorganisation, der benötigte Informationen aus unstrukturierten Daten oder Dateien extrahiert und in strukturierte Informationen umwandelt. Er kann zudem Werkzeuge aufrufen, um diese Informationen in Formulare einzutragen.

### Nutzung

Rufen Sie `Dex` auf der Formularseite auf, um das Konversationsfenster zu öffnen.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Klicken Sie im Eingabefeld auf `Arbeitskontext hinzufügen` und wählen Sie `Block auswählen`. Die Seite wechselt nun in den Modus zur Blockauswahl.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Wählen Sie den Formularblock auf der Seite aus.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Geben Sie im Dialogfenster die Daten ein, die `Dex` organisieren soll.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Nach dem Absenden wird `Dex` die Daten strukturieren und seine Fähigkeiten nutzen, um die Daten im ausgewählten Formular zu aktualisieren.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Datenmodellierer

### Einführung

> Sammlungen intelligent entwerfen und Datenbankstrukturen optimieren.

`Orin` ist ein Experte für Datenmodellierung. Auf der Konfigurationsseite der Hauptdatenquelle können Sie sich von `Orin` beim Erstellen oder Ändern von Sammlungen helfen lassen.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Nutzung

Rufen Sie das Datenquellen-Manager-Plugin auf und wählen Sie die Konfiguration der Hauptdatenquelle aus.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Klicken Sie oben rechts auf den Avatar von `Orin`, um das Dialogfenster des AI-Mitarbeiters zu öffnen.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Beschreiben Sie `Orin` Ihre Modellierungsanforderungen, senden Sie diese ab und warten Sie auf eine Antwort. 

Sobald `Orin` Ihre Anforderungen bestätigt hat, wird er seine Fähigkeiten einsetzen und Ihnen eine Vorschau der Datenmodellierung antworten.

Nachdem Sie die Vorschau überprüft haben, klicken Sie auf die Schaltfläche `Überprüfung abschließen und anwenden`, um die Sammlungen gemäß der Modellierung von `Orin` zu erstellen.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Frontend-Ingenieur

### Einführung

> Hilft Ihnen beim Schreiben und Optimieren von Frontend-Code, um komplexe Interaktionslogik zu implementieren.

`Nathan` ist der Experte für Frontend-Entwicklung in NocoBase. In Szenarien, in denen JavaScript erforderlich ist, wie z. B. `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` und `Linkage`, erscheint `Nathans` Avatar in der oberen rechten Ecke des Code-Editors. Sie können ihn bitten, Ihnen beim Schreiben oder Ändern des Codes im Editor zu helfen.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Nutzung

Klicken Sie im Code-Editor auf `Nathan`, um das Dialogfenster des AI-Mitarbeiters zu öffnen. Der Code im Editor wird automatisch an das Eingabefeld angehängt und als Anwendungskontext an `Nathan` gesendet.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Geben Sie Ihre Codierungsanforderungen ein, senden Sie diese an `Nathan` und warten Sie auf seine Antwort.