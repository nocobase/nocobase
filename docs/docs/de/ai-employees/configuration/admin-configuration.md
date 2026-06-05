:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# KI-Mitarbeiter · Konfigurationshandbuch für Administratoren

> Dieses Dokument erklärt Ihnen Schritt für Schritt, wie Sie KI-Mitarbeiter konfigurieren und verwalten – von den Modell-Services bis zur Aufgabenverteilung.

## I. Bevor Sie beginnen

### 1. Systemanforderungen

Bevor Sie mit der Konfiguration beginnen, stellen Sie bitte sicher, dass Ihre Umgebung die folgenden Voraussetzungen erfüllt:

*   **NocoBase 2.0 oder höher** ist installiert
*   Das **KI-Mitarbeiter-Plugin** ist aktiviert
*   Mindestens ein verfügbarer **Large Language Model Service** (z. B. OpenAI, Claude, DeepSeek, GLM usw.)

### 2. Das zweistufige Design von KI-Mitarbeitern verstehen

KI-Mitarbeiter sind in zwei Ebenen unterteilt: **„Rollendefinition“** und **„Aufgabenanpassung“**.

| Ebene              | Beschreibung                               | Merkmale                               | Funktion                     |
| :----------------- | :----------------------------------------- | :------------------------------------- | :--------------------------- |
| **Rollendefinition** | Grundlegende Persönlichkeit und Kernfähigkeiten des Mitarbeiters | Stabil und unveränderlich, wie ein „Lebenslauf“ | Gewährleistet Rollenkonsistenz |
| **Aufgabenanpassung** | Konfiguration für verschiedene Geschäftsszenarien  | Flexibel anpassbar                     | Passt sich spezifischen Aufgaben an  |

**Einfach ausgedrückt:**

> Die „Rollendefinition“ legt fest, wer dieser Mitarbeiter ist,
> die „Aufgabenanpassung“ bestimmt, was er gerade tun soll.

Die Vorteile dieses Designs sind:

*   Die Rolle bleibt konstant, kann aber verschiedene Szenarien bewältigen.
*   Das Aktualisieren oder Ersetzen von Aufgaben hat keinen Einfluss auf den Mitarbeiter selbst.
*   Hintergrund und Aufgaben sind unabhängig voneinander, was die Wartung erleichtert.

## II. Konfigurationsprozess (in 5 Schritten)

### Schritt 1: Modell-Service konfigurieren

Der Modell-Service ist wie das Gehirn eines KI-Mitarbeiters und muss zuerst eingerichtet werden.

> 💡 Detaillierte Konfigurationsanweisungen finden Sie unter: [LLM-Service konfigurieren](/ai-employees/quick-start/llm-service)

**Pfad:**
`Systemeinstellungen → KI-Mitarbeiter → Modell-Service`

![Konfigurationsseite aufrufen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klicken Sie auf **Hinzufügen** und geben Sie die folgenden Informationen ein:

| Element           | Beschreibung                                   | Hinweise                                   |
| :---------------- | :--------------------------------------------- | :----------------------------------------- |
| Schnittstellentyp | z. B. OpenAI, Claude usw.                      | Kompatibel mit Services, die dieselbe Spezifikation verwenden |
| API-Schlüssel     | Der vom Serviceanbieter bereitgestellte Schlüssel | Vertraulich behandeln und regelmäßig ändern |
| Service-Adresse   | API-Endpunkt                                   | Muss bei Verwendung eines Proxys geändert werden |
| Modellname        | Spezifischer Modellname (z. B. gpt-4, claude-opus) | Beeinflusst Fähigkeiten und Kosten         |

![Großen Modell-Service erstellen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Nach der Konfiguration **testen Sie bitte die Verbindung**.
Sollte der Test fehlschlagen, überprüfen Sie bitte Ihre Netzwerkverbindung, den API-Schlüssel oder den Modellnamen.

![Verbindung testen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Schritt 2: KI-Mitarbeiter erstellen

> 💡 Detaillierte Anweisungen finden Sie unter: [KI-Mitarbeiter erstellen](/ai-employees/quick-start/ai-employees)

Pfad: `KI-Mitarbeiter-Verwaltung → Mitarbeiter erstellen`

Füllen Sie die grundlegenden Informationen aus:

| Feld              | Erforderlich | Beispiel             |
| :---------------- | :----------- | :------------------- |
| Name              | ✓            | viz, dex, cole       |
| Spitzname         | ✓            | Viz, Dex, Cole       |
| Aktivierungsstatus | ✓            | Aktiviert            |
| Beschreibung      | -            | „Datenanalyse-Experte“ |
| Haupt-Prompt      | ✓            | Siehe Prompt Engineering Guide |
| Begrüßungsnachricht | -            | „Hallo, ich bin Viz…“ |

![Grundlegende Informationen konfigurieren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Binden Sie anschließend den soeben konfigurierten **Modell-Service** ein.

![Großen Modell-Service binden](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Vorschläge zur Prompt-Erstellung:**

*   Beschreiben Sie klar die Rolle, den Ton und die Verantwortlichkeiten des Mitarbeiters.
*   Verwenden Sie Wörter wie „muss“ und „niemals“, um Regeln zu betonen.
*   Fügen Sie möglichst Beispiele hinzu, um abstrakte Beschreibungen zu vermeiden.
*   Halten Sie die Länge zwischen 500 und 1000 Zeichen.

> Je klarer der Prompt, desto stabiler ist die Leistung der KI.
> Sie können sich am [Prompt Engineering Guide](./prompt-engineering-guide.md) orientieren.

### Schritt 3: Fähigkeiten konfigurieren

Fähigkeiten bestimmen, was ein Mitarbeiter „tun kann“.

> 💡 Detaillierte Anweisungen finden Sie unter: [Fähigkeiten](/ai-employees/advanced/skill)

| Typ         | Fähigkeitsbereich             | Beispiel                     | Risikostufe              |
| :---------- | :--------------------------- | :--------------------------- | :----------------------- |
| Frontend    | Seiteninteraktion            | Blockdaten lesen, Formulare ausfüllen | Niedrig                  |
| Datenmodell | Datenabfrage und -analyse    | Aggregierte Statistiken      | Mittel                   |
| Workflow    | Geschäftsprozesse ausführen | Benutzerdefinierte Tools     | Abhängig vom Workflow |
| Sonstiges   | Externe Erweiterungen        | Websuche, Dateivorgänge      | Variiert                 |

**Konfigurationsvorschläge:**

*   3–5 Fähigkeiten pro Mitarbeiter sind am besten geeignet.
*   Es wird nicht empfohlen, alle Fähigkeiten auszuwählen, da dies zu Verwirrung führen kann.
*   Deaktivieren Sie die automatische Nutzung (Auto usage) vor wichtigen Vorgängen.

![Fähigkeiten konfigurieren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Schritt 4: Wissensdatenbank konfigurieren (Optional)

Wenn Ihr KI-Mitarbeiter eine große Menge an Material, wie z. B. Produkthandbücher oder FAQs, speichern oder referenzieren muss, können Sie eine Wissensdatenbank konfigurieren.

> 💡 Detaillierte Anweisungen finden Sie unter:
>
> *   [Übersicht über KI-Wissensdatenbanken](/ai-employees/knowledge-base/index)
> *   [Vektordatenbank](/ai-employees/knowledge-base/vector-database)
> *   [Wissensdatenbank-Konfiguration](/ai-employees/knowledge-base/knowledge-base)
> *   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Dies erfordert die zusätzliche Installation des Vektordatenbank-Plugins.

![Wissensdatenbank konfigurieren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Anwendbare Szenarien:**

*   Damit die KI Unternehmenswissen versteht
*   Zur Unterstützung von Dokumenten-Q&A und -Abfragen
*   Zum Trainieren von domänenspezifischen Assistenten

### Schritt 5: Ergebnis überprüfen

Nach Abschluss sehen Sie den Avatar des neuen Mitarbeiters in der unteren rechten Ecke der Seite.

![Konfiguration überprüfen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Bitte überprüfen Sie jeden Punkt:

*   ✅ Wird das Symbol korrekt angezeigt?
*   ✅ Kann eine grundlegende Konversation geführt werden?
*   ✅ Können Fähigkeiten korrekt aufgerufen werden?

Wenn alle Punkte erfüllt sind, war die Konfiguration erfolgreich 🎉

## III. Aufgabenkonfiguration: KI in den Einsatz bringen

Bisher haben wir einen „Mitarbeiter erstellt“.
Als Nächstes geht es darum, ihn „arbeiten zu lassen“.

KI-Aufgaben definieren das Verhalten des Mitarbeiters auf einer bestimmten Seite oder in einem bestimmten Block.

> 💡 Detaillierte Anweisungen finden Sie unter: [Aufgaben](/ai-employees/advanced/task)

### 1. Seitenbezogene Aufgaben

Anwendbar für den gesamten Seitenbereich, z. B. „Daten auf dieser Seite analysieren“.

**Konfigurationseinstieg:**
`Seiteneinstellungen → KI-Mitarbeiter → Aufgabe hinzufügen`

| Feld           | Beschreibung                     | Beispiel                     |
| :------------- | :------------------------------- | :--------------------------- |
| Titel          | Aufgabenname                     | Phasenkonversionsanalyse     |
| Kontext        | Der Kontext der aktuellen Seite  | Leads-Listenansicht          |
| Standardnachricht | Voreingestellter Gesprächsbeginn | „Bitte analysieren Sie die Trends dieses Monats“ |
| Standard-Block | Automatische Verknüpfung mit einer Sammlung | Leads-Tabelle                |
| Fähigkeiten    | Verfügbare Tools                 | Daten abfragen, Diagramme generieren |

![Seitenbezogene Aufgabenkonfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Unterstützung für mehrere Aufgaben:**
Einem einzelnen KI-Mitarbeiter können mehrere Aufgaben zugewiesen werden, die dem Benutzer als Optionen zur Auswahl angeboten werden:

![Unterstützung für mehrere Aufgaben](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Vorschläge:

*   Eine Aufgabe sollte sich auf ein Ziel konzentrieren.
*   Der Name sollte klar und leicht verständlich sein.
*   Die Anzahl der Aufgaben sollte 5–7 nicht überschreiten.

### 2. Blockbezogene Aufgaben

Geeignet für die Bearbeitung eines bestimmten Blocks, z. B. „Aktuelles Formular übersetzen“.

**Konfigurationsmethode:**

1.  Öffnen Sie die Block-Aktionskonfiguration.
2.  Fügen Sie „KI-Mitarbeiter“ hinzu.

![KI-Mitarbeiter-Schaltfläche hinzufügen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Binden Sie den Zielmitarbeiter ein.

![KI-Mitarbeiter auswählen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Blockbezogene Aufgabenkonfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Vergleich   | Seitenbezogen | Blockbezogen             |
| :---------- | :------------ | :----------------------- |
| Datenbereich | Ganze Seite   | Aktueller Block          |
| Granularität | Globale Analyse | Detailverarbeitung       |
| Typische Anwendung | Trendanalyse  | Formularübersetzung, Feldextraktion |

## IV. Best Practices

### 1. Konfigurationsempfehlungen

| Element           | Empfehlung                         | Grund                                   |
| :---------------- | :--------------------------------- | :-------------------------------------- |
| Anzahl der Fähigkeiten | 3–5                                | Hohe Genauigkeit, schnelle Reaktion     |
| Auto usage        | Mit Vorsicht aktivieren            | Verhindert Fehlbedienungen              |
| Prompt-Länge      | 500–1000 Zeichen                   | Ausgewogenheit zwischen Geschwindigkeit und Qualität |
| Aufgabenziel      | Einzeln und klar                   | Vermeidet Verwirrung der KI             |
| Workflow          | Nach Kapselung komplexer Aufgaben verwenden | Höhere Erfolgsquote                     |

### 2. Praktische Empfehlungen

**Schrittweise optimieren, von klein nach groß:**

1.  Erstellen Sie zunächst grundlegende Mitarbeiter (z. B. Viz, Dex).
2.  Aktivieren Sie 1–2 Kernfähigkeiten zum Testen.
3.  Bestätigen Sie, dass Aufgaben normal ausgeführt werden können.
4.  Erweitern Sie dann schrittweise um weitere Fähigkeiten und Aufgaben.

**Kontinuierlicher Optimierungsprozess:**

1.  Erste Version in Betrieb nehmen
2.  Nutzer-Feedback sammeln
3.  Prompts und Aufgabenkonfigurationen optimieren
4.  Testen und iterativ verbessern

## V. Häufig gestellte Fragen (FAQ)

### 1. Konfigurationsphase

**F: Was tun, wenn das Speichern fehlschlägt?**
A: Überprüfen Sie, ob alle Pflichtfelder ausgefüllt sind, insbesondere der Modell-Service und der Prompt.

**F: Welches Modell sollte ich wählen?**

*   Code-bezogen → Claude, GPT-4
*   Analyse-bezogen → Claude, DeepSeek
*   Kostensensitiv → Qwen, GLM
*   Lange Texte → Gemini, Claude

### 2. Nutzungsphase

**F: Die KI-Antwort ist zu langsam?**

*   Reduzieren Sie die Anzahl der Fähigkeiten.
*   Optimieren Sie den Prompt.
*   Überprüfen Sie die Latenz des Modell-Services.
*   Erwägen Sie einen Modellwechsel.

**F: Die Aufgabenausführung ist ungenau?**

*   Der Prompt ist nicht klar genug.
*   Zu viele Fähigkeiten führen zu Verwirrung.
*   Teilen Sie die Aufgabe in kleinere Schritte auf und fügen Sie Beispiele hinzu.

**F: Wann sollte „Auto usage“ aktiviert werden?**

*   Für Abfrage-Aufgaben kann es aktiviert werden.
*   Für Aufgaben, die Daten ändern, wird empfohlen, es zu deaktivieren.

**F: Wie bringe ich die KI dazu, ein bestimmtes Formular zu verarbeiten?**

A: Bei seitenbezogenen Konfigurationen müssen Sie den Block manuell auswählen.

![Block manuell auswählen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Bei blockbezogenen Aufgabenkonfigurationen wird der Datenkontext automatisch gebunden.

## VI. Weiterführende Lektüre

Um Ihre KI-Mitarbeiter noch leistungsfähiger zu machen, können Sie die folgenden Dokumente lesen:

**Konfigurationsbezogen:**

*   [Prompt Engineering Guide](./prompt-engineering-guide.md) – Techniken und Best Practices für die Erstellung hochwertiger Prompts
*   [LLM-Service konfigurieren](/ai-employees/quick-start/llm-service) – Detaillierte Konfigurationsanweisungen für Large Language Model Services
*   [KI-Mitarbeiter erstellen](/ai-employees/quick-start/ai-employees) – Erstellung und grundlegende Konfiguration von KI-Mitarbeitern
*   [Mit KI-Mitarbeitern zusammenarbeiten](/ai-employees/quick-start/collaborate) – Wie Sie effektiv mit KI-Mitarbeitern kommunizieren

**Erweiterte Funktionen:**

*   [Fähigkeiten](/ai-employees/advanced/skill) – Detailliertes Verständnis der Konfiguration und Nutzung verschiedener Fähigkeiten
*   [Aufgaben](/ai-employees/advanced/task) – Fortgeschrittene Techniken zur Aufgabenkonfiguration
*   [Block auswählen](/ai-employees/advanced/pick-block) – Wie Sie Datenblöcke für KI-Mitarbeiter festlegen
*   [Datenquelle](/ai-employees/advanced/datasource) – Konfiguration und Verwaltung von Datenquellen
*   [Websuche](/ai-employees/advanced/web-search) – Konfiguration der Websuchfunktion für KI-Mitarbeiter

**Wissensdatenbank & RAG:**

*   [Übersicht über KI-Wissensdatenbanken](/ai-employees/knowledge-base/index) – Einführung in die Wissensdatenbank-Funktion
*   [Vektordatenbank](/ai-employees/knowledge-base/vector-database) – Konfiguration der Vektordatenbank
*   [Wissensdatenbank](/ai-employees/knowledge-base/knowledge-base) – Wie Sie eine Wissensdatenbank erstellen und verwalten
*   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) – Anwendung der RAG-Technologie

**Workflow-Integration:**

*   [LLM-Knoten – Text-Chat](/ai-employees/workflow/nodes/llm/chat) – Verwendung von Text-Chats in Workflows
*   [LLM-Knoten – Multimodaler Chat](/ai-employees/workflow/nodes/llm/multimodal-chat) – Verarbeitung multimodaler Eingaben wie Bilder und Dateien
*   [LLM-Knoten – Strukturierte Ausgabe](/ai-employees/workflow/nodes/llm/structured-output) – Erhalten strukturierter KI-Antworten

## Fazit

Das Wichtigste bei der Konfiguration von KI-Mitarbeitern ist: **Zuerst zum Laufen bringen, dann optimieren**.
Lassen Sie den ersten Mitarbeiter erfolgreich seine Arbeit aufnehmen und erweitern und verfeinern Sie ihn dann schrittweise.

Die Fehlerbehebung kann in folgender Reihenfolge erfolgen:

1.  Ist der Modell-Service verbunden?
2.  Ist die Anzahl der Fähigkeiten zu hoch?
3.  Ist der Prompt klar?
4.  Ist das Aufgabenziel eindeutig definiert?

Wenn Sie Schritt für Schritt vorgehen, können Sie ein wirklich effizientes KI-Team aufbauen.