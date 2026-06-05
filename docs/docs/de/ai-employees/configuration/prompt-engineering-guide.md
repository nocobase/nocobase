:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# KI-Mitarbeiter · Leitfaden für Prompt Engineering

> Von „wie man schreibt“ zu „gut schreiben“ – dieser Leitfaden zeigt Ihnen, wie Sie hochwertige Prompts auf einfache, stabile und wiederverwendbare Weise erstellen.

## 1. Warum Prompts entscheidend sind

Ein Prompt ist die „Stellenbeschreibung“ für einen KI-Mitarbeiter und bestimmt direkt dessen Stil, Grenzen und die Qualität der Ergebnisse.

**Vergleichsbeispiel:**

❌ Unklarer Prompt:

```
Sie sind ein Datenanalyse-Assistent, der Benutzern bei der Datenanalyse hilft.
```

✅ Klarer und kontrollierbarer Prompt:

```
Sie sind Viz, ein Datenanalyse-Experte.

Rollendefinition
- Stil: Erkenntnisreich, klar in der Ausdrucksweise, visualisierungsorientiert
- Mission: Komplexe Daten in verständliche „Diagramm-Geschichten“ verwandeln

Workflow
1) Anforderungen verstehen
2) Sicheres SQL generieren (nur SELECT verwenden)
3) Erkenntnisse extrahieren
4) Mit Diagrammen präsentieren

Harte Regeln
- MUSS: Nur SELECT verwenden, niemals Daten ändern
- IMMER: Standardmäßig Diagrammvisualisierungen ausgeben
- NIEMALS: Daten erfinden oder erraten

Ausgabeformat
Kurze Schlussfolgerung (2-3 Sätze) + ECharts Diagramm-JSON
```

**Fazit**: Ein guter Prompt definiert klar, „wer es ist, was zu tun ist, wie es zu tun ist und nach welchem Standard“, wodurch die Leistung der KI stabil und kontrollierbar wird.

## 2. Die „Neun Elemente“ Goldene Formel für Prompts

Eine in der Praxis bewährte und effektive Struktur:

```
Benennung + Doppelte Anweisungen + Simulierte Bestätigung + Wiederholung + Harte Regeln
+ Hintergrundinformationen + Positive Verstärkung + Referenzbeispiele + Negative Beispiele (Optional)
```

### 2.1 Beschreibung der Elemente

| Element               | Was es löst                               | Warum es effektiv ist                      |
| --------------------- | ----------------------------------------- | ------------------------------------------ |
| Benennung             | Klärt Identität und Stil                  | Hilft der KI, ein „Rollengefühl“ zu entwickeln |
| Doppelte Anweisungen  | Unterscheidet „Wer ich bin“ von „Was ich tun muss“ | Reduziert Rollenverwirrung                  |
| Simulierte Bestätigung | Wiederholt das Verständnis vor der Ausführung | Verhindert Abweichungen                    |
| Wiederholung          | Schlüsselpunkte erscheinen wiederholt     | Erhöht die Priorität                       |
| Harte Regeln          | MUSS/IMMER/NIEMALS                        | Schafft eine Basislinie                    |
| Hintergrundinformationen | Notwendiges Wissen und Einschränkungen    | Reduziert Missverständnisse                |
| Positive Verstärkung  | Leitet Erwartungen und Stil               | Stabilerer Ton und Leistung                |
| Referenzbeispiele     | Bietet ein direktes Nachahmungsmodell     | Die Ausgabe entspricht eher den Erwartungen |
| Negative Beispiele    | Vermeidet häufige Fallstricke             | Korrigiert Fehler, wird mit der Nutzung genauer |

### 2.2 Schnellstart-Vorlage

```yaml
# 1) Benennung
Sie sind [Name], ein exzellenter [Rolle/Spezialist].

# 2) Doppelte Anweisungen
## Rolle
Stil: [Adjektiv x2-3]
Mission: [Ein Satz, der die Hauptverantwortung zusammenfasst]

## Aufgaben-Workflow
1) Verstehen: [Schlüsselpunkt]
2) Ausführen: [Schlüsselpunkt]
3) Überprüfen: [Schlüsselpunkt]
4) Präsentieren: [Schlüsselpunkt]

# 3) Simulierte Bestätigung
Wiederholen Sie vor der Ausführung Ihr Verständnis: „Ich verstehe, dass Sie … benötigen. Ich werde dies durch … erreichen.“

# 4) Wiederholung
Kernanforderung: [1-2 kritischste Punkte] (mindestens zweimal am Anfang/im Workflow/am Ende erscheinen)

# 5) Harte Regeln
MUSS: [Unverbrüchliche Regel]
IMMER: [Stets zu befolgendes Prinzip]
NIEMALS: [Ausdrücklich verbotene Aktion]

# 6) Hintergrundinformationen
[Notwendiges Domänenwissen/Kontext/Häufige Fallstricke]

# 7) Positive Verstärkung
Sie zeichnen sich in [Fähigkeit] aus und sind versiert in [Spezialität]. Bitte behalten Sie diesen Stil bei, um die Aufgabe zu erledigen.

# 8) Referenzbeispiele
[Geben Sie ein prägnantes Beispiel der „idealen Ausgabe“]

# 9) Negative Beispiele (Optional)
- [Falsche Vorgehensweise] → [Richtige Vorgehensweise]
```

## 3. Praktisches Beispiel: Viz (Datenanalyse)

Lassen Sie uns die neun Elemente kombinieren, um ein vollständiges, „sofort einsatzbereites“ Beispiel zu erstellen.

```text
# Benennung
Sie sind Viz, ein Datenanalyse-Experte.

# Doppelte Anweisungen
【Rolle】
Stil: Erkenntnisreich, klar, visuell orientiert
Mission: Komplexe Daten in „Diagramm-Geschichten“ verwandeln

【Aufgaben-Workflow】
1) Verstehen: Analysieren Sie die Datenanforderungen und den Metrikumfang des Benutzers
2) Abfragen: Sicheres SQL generieren (nur echte Daten abfragen, nur SELECT)
3) Analysieren: Extrahieren Sie wichtige Erkenntnisse (Trends/Vergleiche/Anteile)
4) Präsentieren: Wählen Sie ein geeignetes Diagramm zur klaren Darstellung

# Simulierte Bestätigung
Wiederholen Sie vor der Ausführung: „Ich verstehe, dass Sie [Objekt/Umfang] analysieren möchten, und ich werde die Ergebnisse mittels [Abfrage- und Visualisierungsmethode] präsentieren.“

# Wiederholung
Nochmals betonen: Datenauthentizität hat Priorität, Qualität vor Quantität; wenn keine Daten verfügbar sind, geben Sie dies wahrheitsgemäß an.

# Harte Regeln
MUSS: Nur SELECT-Abfragen verwenden, keine Daten ändern
IMMER: Standardmäßig eine visuelle Diagrammdarstellung ausgeben
NIEMALS: Daten erfinden oder erraten

# Hintergrundinformationen
- ECharts erfordert eine „reine JSON“-Konfiguration, ohne Kommentare/Funktionen
- Jedes Diagramm sollte sich auf ein Thema konzentrieren, vermeiden Sie das Anhäufen mehrerer Metriken

# Positive Verstärkung
Sie sind geschickt darin, aus echten Daten umsetzbare Schlussfolgerungen zu ziehen und diese mit den einfachsten Diagrammen auszudrücken.

# Referenzbeispiele
Beschreibung (2-3 Sätze) + Diagramm-JSON

Beispielbeschreibung:
Diesen Monat wurden 127 neue Leads hinzugefügt, ein Anstieg von 23 % im Vergleich zum Vormonat, hauptsächlich aus Drittanbieterkanälen.

Beispiel-Diagramm:
{
  "title": {"text": "Lead-Trend dieses Monats"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Woche1","Woche2","Woche3","Woche4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Negative Beispiele (Optional)
- Sprachmix → Sprachkonsistenz beibehalten
- Überladene Diagramme → Jedes Diagramm sollte nur ein Thema ausdrücken
- Unvollständige Daten → Wahrheitsgemäß angeben: „Keine Daten verfügbar“
```

**Design-Punkte**

* „Authentizität“ erscheint mehrfach im Workflow, in den Wiederholungen und Regeln (starke Erinnerung)
* Wählen Sie eine zweiteilige „Beschreibung + JSON“-Ausgabe für eine einfache Frontend-Integration
* „Nur-Lese-SQL“ klar definieren, um Risiken zu reduzieren

## 4. Wie Sie Prompts im Laufe der Zeit verbessern können

### 4.1 Fünf-Schritte-Iteration

```
Beginnen Sie mit einer funktionierenden Version → Testen Sie in kleinem Umfang → Protokollieren Sie Probleme → Fügen Sie Regeln/Beispiele zur Behebung hinzu → Erneut testen
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Optimierungsprozess" width="50%">

Es wird empfohlen, 5–10 typische Aufgaben auf einmal zu testen und eine Runde innerhalb von 30 Minuten abzuschließen.

### 4.2 Prinzipien und Verhältnisse

*   **Positive Anleitung priorisieren**: Sagen Sie der KI zuerst, was sie tun soll
*   **Problemgesteuerte Verbesserung**: Fügen Sie Einschränkungen nur hinzu, wenn Probleme auftreten
*   **Moderate Einschränkungen**: Häufen Sie nicht von Anfang an „Verbote“ an

Empirisches Verhältnis: **80 % Positiv : 20 % Negativ**.

### 4.3 Eine typische Optimierung

**Problem**: Überladene Diagramme, schlechte Lesbarkeit
**Optimierung**:

1.  Fügen Sie unter „Hintergrundinformationen“ hinzu: ein Thema pro Diagramm
2.  Geben Sie unter „Referenzbeispiele“ ein „Einzelmetrik-Diagramm“ an
3.  Wenn das Problem weiterhin besteht, fügen Sie eine harte Einschränkung unter „Harte Regeln/Wiederholung“ hinzu

## 5. Fortgeschrittene Techniken

### 5.1 Verwenden Sie XML/Tags für eine klarere Struktur (empfohlen für lange Prompts)

Wenn der Inhalt 1000 Zeichen überschreitet oder verwirrend sein kann, ist die Verwendung von Tags zur Partitionierung stabiler:

```xml
<Rolle>Sie sind Dex, ein Datenorganisations-Experte.</Rolle>
<Stil>Sorgfältig, genau und organisiert.</Stil>

<Aufgabe>
Muss in folgenden Schritten abgeschlossen werden:
1. Schlüssel-Felder identifizieren
2. Feldwerte extrahieren
3. Format standardisieren (Datum JJJJ-MM-TT)
4. JSON ausgeben
</Aufgabe>

<Regeln>
MUSS: Genauigkeit der Feldwerte beibehalten
NIEMALS: Fehlende Informationen erraten
IMMER: Unsichere Elemente kennzeichnen
</Regeln>

<Beispiel>
{"Name":"Max Mustermann","Datum":"2024-01-15","Betrag":5000,"Status":"Bestätigt"}
</Beispiel>
```

### 5.2 Geschichteter „Hintergrund + Aufgabe“-Ansatz (eine intuitivere Methode)

*   **Hintergrund** (langfristige Stabilität): Wer dieser Mitarbeiter ist, sein Stil und welche Fähigkeiten er besitzt
*   **Aufgabe** (bei Bedarf): Was jetzt zu tun ist, welche Metriken im Fokus stehen und was der Standardumfang ist

Dies passt natürlich zum NocoBase „Mitarbeiter + Aufgabe“-Modell: ein fester Hintergrund mit flexiblen Aufgaben.

### 5.3 Modulare Wiederverwendung

Zerlegen Sie gängige Regeln in Module, um sie nach Bedarf zu kombinieren:

**Datensicherheitsmodul**

```
MUSS: Nur SELECT verwenden
NIEMALS: INSERT/UPDATE/DELETE ausführen
```

**Ausgabestrukturmodul**

```
Die Ausgabe muss Folgendes enthalten:
1) Kurze Beschreibung (2-3 Sätze)
2) Kerninhalt (Diagramm/Daten/Code)
3) Optionale Vorschläge (falls vorhanden)
```

## 6. Goldene Regeln (Praktische Schlussfolgerungen)

1.  Eine KI erledigt nur eine Art von Aufgabe; Spezialisierung ist stabiler
2.  Beispiele sind effektiver als Slogans; geben Sie zuerst positive Vorbilder
3.  Verwenden Sie MUSS/IMMER/NIEMALS, um Grenzen zu setzen
4.  Prozessorientierte Ausdrucksweise, um Unsicherheiten zu reduzieren
5.  Kleine Schritte, mehr testen, weniger ändern und kontinuierlich iterieren
6.  Nicht zu viele Einschränkungen, um „Hardcoding“ zu vermeiden
7.  Probleme und Änderungen protokollieren, um Versionen zu erstellen
8.  80/20: Erklären Sie zuerst, „wie es richtig gemacht wird“, und schränken Sie dann ein, „was nicht falsch gemacht werden soll“

## 7. Häufig gestellte Fragen

**F1: Welche Länge ist ideal?**

*   Basis-Mitarbeiter: 500–800 Zeichen
*   Komplexer Mitarbeiter: 800–1500 Zeichen
*   Nicht empfohlen >2000 Zeichen (kann langsam und redundant sein)
    Standard: Alle neun Elemente abdecken, aber ohne unnötigen Ballast.

**F2: Was tun, wenn die KI Anweisungen nicht befolgt?**

1.  Verwenden Sie MUSS/IMMER/NIEMALS, um Grenzen zu klären
2.  Wiederholen Sie Schlüsselanforderungen 2–3 Mal
3.  Verwenden Sie Tags/Partitionen, um die Struktur zu verbessern
4.  Geben Sie mehr positive Beispiele, weniger abstrakte Prinzipien
5.  Bewerten Sie, ob ein leistungsfähigeres Modell erforderlich ist

**F3: Wie gleicht man positive und negative Anleitung aus?**
Schreiben Sie zuerst die positiven Teile (Rolle, Workflow, Beispiele), fügen Sie dann basierend auf Fehlern Einschränkungen hinzu und beschränken Sie nur die Punkte, die „wiederholt falsch“ sind.

**F4: Sollte es häufig aktualisiert werden?**

*   Hintergrund (Identität/Stil/Kernfähigkeiten): Langfristige Stabilität
*   Aufgabe (Szenario/Metriken/Umfang): Anpassung an Geschäftsanforderungen
*   Erstellen Sie bei Änderungen eine neue Version und protokollieren Sie, „warum sie geändert wurde“.

## 8. Nächste Schritte

**Praktische Übung**

*   Wählen Sie eine einfache Rolle (z. B. Kundenservice-Assistent), schreiben Sie eine „funktionierende Version“ unter Verwendung der neun Elemente und testen Sie diese mit 5 typischen Aufgaben
*   Suchen Sie einen bestehenden Mitarbeiter, sammeln Sie 3–5 reale Probleme und führen Sie eine kleine Iteration durch

**Weiterführende Literatur**

*   [KI-Mitarbeiter · Leitfaden zur Administratorkonfiguration](./admin-configuration.md): Prompts in die tatsächliche Konfiguration übertragen
*   Spezielle Handbücher für jeden KI-Mitarbeiter: Vollständige Rollen-/Aufgabenvorlagen anzeigen

## Fazit

**Erst zum Laufen bringen, dann verfeinern.**
Beginnen Sie mit einer „funktionierenden“ Version und sammeln Sie kontinuierlich Probleme, fügen Sie Beispiele und Regeln in realen Aufgaben hinzu.
Denken Sie daran: **Sagen Sie ihr zuerst, wie sie die Dinge richtig macht (positive Anleitung), und schränken Sie sie dann ein, Fehler zu machen (moderate Einschränkung).**