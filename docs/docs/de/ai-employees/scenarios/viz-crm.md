# KI-Mitarbeiter · Viz: Leitfaden zur Konfiguration von CRM-Szenarien

> Am Beispiel des CRM-Szenarios erfahren Sie, wie Ihr KI-Analyseexperte Ihr Geschäft wirklich versteht und sein volles Potenzial entfaltet.

## 1. Einleitung: Wie Viz lernt, Daten nicht nur zu sehen, sondern auch zu verstehen

Im NocoBase-System ist **Viz** ein vordefinierter KI-Analyseexperte.
Er kann den Seitenkontext (wie Leads, Opportunities, Accounts) erkennen und Trenddiagramme, Trichterdiagramme und KPI-Karten generieren.
Standardmäßig verfügt er jedoch nur über die grundlegendsten Abfragefunktionen:

| Tool                      | Funktionsbeschreibung    | Sicherheit  |
| ----------------------- | -------------------- | ---- |
| Get Collection Names    | Sammlungsliste abrufen | ✅ Sicher |
| Get Collection Metadata | Feldstruktur abrufen  | ✅ Sicher |

Diese Tools ermöglichen es Viz lediglich, die Struktur zu erkennen, aber noch nicht, den Inhalt wirklich zu verstehen.
Damit er Erkenntnisse generieren, Anomalien erkennen und Trends analysieren kann, müssen Sie ihn mit **passenderen Analysetools erweitern**.

In der offiziellen CRM-Demo haben wir zwei Ansätze verwendet:

*   **Overall Analytics (Allzweck-Analyse-Engine)**: Eine vorlagenbasierte, sichere und wiederverwendbare Lösung;
*   **SQL Execution (Spezialisierte Analyse-Engine)**: Bietet mehr Flexibilität, birgt aber auch größere Risiken.

Diese beiden sind jedoch nicht die einzigen Optionen; sie ähneln eher einem **Designparadigma**:

> Sie können ihren Prinzipien folgen, um eine Implementierung zu erstellen, die besser zu Ihrem eigenen Geschäft passt.

---

## 2. Die Struktur von Viz: Stabile Persönlichkeit + Flexible Aufgaben

Um zu verstehen, wie Viz erweitert werden kann, muss man zunächst sein geschichtetes internes Design verstehen:

| Ebene       | Beschreibung                              | Beispiel    |
| -------- | --------------------------------------- | ----- |
| **Rollendefinition** | Viz' Persönlichkeit und Analysemethode: Verstehen → Abfragen → Analysieren → Visualisieren | Festgelegt  |
| **Aufgabendefinition** | Angepasste Prompts und Tool-Kombinationen für ein spezifisches Geschäftsszenario             | Modifizierbar   |
| **Tool-Konfiguration** | Die Brücke für Viz, um externe Datenquellen oder Workflows aufzurufen              | Frei austauschbar |

Dieses geschichtete Design ermöglicht es Viz, eine stabile Persönlichkeit (konsistente Analyselogik) zu bewahren,
und sich gleichzeitig schnell an verschiedene Geschäftsszenarien anzupassen (CRM, Krankenhausverwaltung, Kanalanalyse, Produktionsabläufe...).

---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


## 3. Muster Eins: Vorlagenbasierte Analyse-Engine (Empfohlen)

### 3.1 Prinzipielle Übersicht

**Overall Analytics** ist die zentrale Analyse-Engine in der CRM-Demo.
Sie verwaltet alle SQL-Abfragen über eine **Datenanalyse-Vorlagensammlung (data_analysis)**.
Viz schreibt SQL nicht direkt, sondern **ruft vordefinierte Vorlagen auf**, um Ergebnisse zu generieren.

Der Ausführungsablauf ist wie folgt:

```mermaid
flowchart TD
    A[Viz empfängt Aufgabe] --> B[Ruft Overall Analytics Workflow auf]
    B --> C[Gleicht Vorlage basierend auf aktueller Seite/Aufgabe ab]
    C --> D[Führt Vorlagen-SQL aus (schreibgeschützt)]
    D --> E[Gibt Datenergebnis zurück]
    E --> F[Viz generiert Diagramm + kurze Interpretation]
```

Auf diese Weise kann Viz in Sekundenschnelle sichere und standardisierte Analyseergebnisse generieren,
und Administratoren können alle SQL-Vorlagen zentral verwalten und überprüfen.

---

### 3.2 Struktur der Vorlagensammlung (data_analysis)

| Feldname                                               | Typ       | Beschreibung            | Beispiel                                                 |
| ------------------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| **id**                                            | Integer  | Primärschlüssel            | 1                                                  |
| **name**                                          | Text     | Name der Analysevorlage        | Leads Data Analysis                                |
| **collection**                                    | Text     | Zugehörige Sammlung         | Lead                                               |
| **sql**                                           | Code     | Analyse-SQL-Anweisung (schreibgeschützt) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                   | Markdown | Vorlagenbeschreibung oder Definition       | "Anzahl der Leads nach Phase"                                        |
| **createdAt / createdBy / updatedAt / updatedBy** | Systemfeld     | Audit-Informationen          | Automatisch generiert                                               |

#### Vorlagenbeispiele in der CRM-Demo

| Name                             | Collection  | Description |
| -------------------------------- | ----------- | ----------- |
| Account Data Analysis            | Account     | Kontodatenanalyse      |
| Contact Data Analysis            | Contact     | Kontaktdatenanalyse       |
| Leads Data Analysis              | Lead        | Lead-Trendanalyse      |
| Opportunity Data Analysis        | Opportunity | Trichter für Opportunity-Phasen      |
| Task Data Analysis               | Todo Tasks  | Statistik des Status von Aufgaben    |
| Users (Sales Reps) Data Analysis | Users       | Leistungsvergleich der Vertriebsmitarbeiter    |

---

### 3.3 Vorteile dieses Musters

| Dimension | Vorteil |
| -------- | ------------------------------------------------------ |
| **Sicherheit**  | Alle SQL-Abfragen werden gespeichert und überprüft, wodurch die direkte Generierung von Abfragen vermieden wird. |
| **Wartbarkeit** | Vorlagen werden zentral verwaltet und einheitlich aktualisiert.            |
| **Wiederverwendbarkeit** | Dieselbe Vorlage kann von mehreren Aufgaben wiederverwendet werden.           |
| **Portabilität** | Kann problemlos auf andere Systeme migriert werden, da nur dieselbe Sammlungsstruktur erforderlich ist.    |
| **Benutzererfahrung** | Geschäftsanwender müssen sich nicht um SQL kümmern; sie müssen lediglich eine Analyseanfrage stellen.  |

> 📘 Diese `data_analysis`-Sammlung muss nicht unbedingt diesen Namen tragen.
> Entscheidend ist: **Analyselogik vorlagenbasiert speichern** und sie einheitlich über einen Workflow aufrufen lassen.

---

### 3.4 Wie Viz es verwendet

In der Aufgabendefinition können Sie Viz explizit mitteilen:

```markdown
Hallo Viz,

Bitte analysieren Sie die Daten des aktuellen Moduls.

**Priorität:** Verwenden Sie das Overall Analytics Tool, um Analyseergebnisse aus der Vorlagensammlung abzurufen.
**Falls keine passende Vorlage gefunden wird:** Geben Sie an, dass eine Vorlage fehlt, und schlagen Sie dem Administrator vor, diese hinzuzufügen.

Ausgabeanforderungen:
- Generieren Sie für jedes Ergebnis ein separates Diagramm;
- Fügen Sie unterhalb des Diagramms eine kurze Beschreibung von 2–3 Sätzen hinzu;
- Erfinden Sie keine Daten und treffen Sie keine Annahmen.
```

Auf diese Weise ruft Viz automatisch den Workflow auf, gleicht die am besten geeignete SQL-Abfrage aus der Vorlagensammlung ab und generiert das Diagramm.

---

## 4. Muster Zwei: Spezialisierter SQL-Executor (Vorsicht geboten)

### 4.1 Anwendbare Szenarien

Wenn Sie explorative Analysen, Ad-hoc-Abfragen oder JOIN-Aggregationen über mehrere Sammlungen hinweg benötigen, können Sie Viz ein **SQL Execution** Tool aufrufen lassen.

Die Merkmale dieses Tools sind:

*   Viz kann `SELECT`-Abfragen direkt generieren;
*   Das System führt sie aus und gibt das Ergebnis zurück;
*   Viz ist für Analyse und Visualisierung verantwortlich.

Beispielaufgabe:

> "Bitte analysieren Sie den Trend der Lead-Konversionsraten nach Regionen über die letzten 90 Tage."

In diesem Fall könnte Viz Folgendes generieren:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Risiken und Schutzempfehlungen

| Risikopunkt    | Schutzstrategie            |
| ------ | --------------- |
| Generierung von Schreiboperationen  | Erzwingen der Beschränkung auf `SELECT`  |
| Zugriff auf irrelevante Sammlungen  | Überprüfen, ob der Sammlungsname existiert        |
| Performance-Risiko bei großen Sammlungen | Zeitbereich begrenzen, Anzahl der Zeilen mit LIMIT beschränken |
| Nachvollziehbarkeit von Operationen  | Abfrageprotokollierung und Auditierung aktivieren       |
| Benutzerberechtigungssteuerung | Nur Administratoren dürfen dieses Tool verwenden      |

> Allgemeine Empfehlungen:
>
> *   Normale Benutzer sollten nur die vorlagenbasierte Analyse (Overall Analytics) aktiviert haben;
> *   Nur Administratoren oder fortgeschrittene Analysten sollten SQL Execution verwenden dürfen.

---

## 5. Wenn Sie Ihr eigenes "Overall Analytics" erstellen möchten

Hier ist ein einfacher, allgemeiner Ansatz, den Sie in jedem System (unabhängig von NocoBase) replizieren können:

### Schritt 1: Entwerfen Sie die Vorlagensammlung

Der Sammlungsname kann beliebig sein (z.B. `analysis_templates`).
Sie muss lediglich die Felder `name`, `sql`, `collection` und `description` enthalten.

### Schritt 2: Schreiben Sie einen Dienst oder Workflow zum "Abrufen der Vorlage → Ausführen"

Logik:

1.  Empfangen Sie die Aufgabe oder den Seitenkontext (z.B. die aktuelle Sammlung);
2.  Gleichen Sie eine Vorlage ab;
3.  Führen Sie die Vorlagen-SQL aus (schreibgeschützt);
4.  Geben Sie eine standardisierte Datenstruktur zurück (Zeilen + Felder).

### Schritt 3: Lassen Sie die KI diese Schnittstelle aufrufen

Der Aufgaben-Prompt kann wie folgt geschrieben werden:

```
Versuchen Sie zuerst, das Vorlagenanalyse-Tool aufzurufen. Wenn in den Vorlagen keine passende Analyse gefunden wird, verwenden Sie den SQL-Executor.
Stellen Sie sicher, dass alle Abfragen schreibgeschützt sind und Diagramme zur Anzeige der Ergebnisse generiert werden.
```

> Auf diese Weise verfügt Ihr KI-Mitarbeiter-System über ähnliche Analysefunktionen wie die CRM-Demo, ist aber völlig unabhängig und anpassbar.

---

## 6. Best Practices und Designempfehlungen

| Empfehlung                     | Beschreibung                                     |
| ---------------------- | ------------------------------------------------ |
| **Vorlagenbasierte Analyse priorisieren**            | Sicher, stabil und wiederverwendbar                              |
| **SQL Execution nur als Ergänzung verwenden** | Beschränkt auf internes Debugging oder Ad-hoc-Abfragen                            |
| **Ein Diagramm, ein Kernpunkt**              | Klare Ausgabe, übermäßige Unordnung vermeiden                            |
| **Eindeutige Vorlagenbenennung**             | Benennung entsprechend der Seite/des Geschäftsbereichs, z.B. `Leads-Stage-Conversion` |
| **Prägnante und klare Erklärungen**             | Jedes Diagramm mit einer 2–3-Satz-Zusammenfassung versehen                          |
| **Fehlende Vorlagen angeben**             | Benutzer informieren, dass "Keine entsprechende Vorlage gefunden" wurde, anstatt eine leere Ausgabe zu liefern                    |

---

## 7. Von der CRM-Demo zu Ihrem Szenario

Egal, ob Sie ein Krankenhaus-CRM, Fertigung, Lagerlogistik oder Bildungsanmeldungen verwalten,
solange Sie die folgenden drei Fragen beantworten können, kann Viz in Ihrem System einen Mehrwert schaffen:

| Frage             | Beispiel                  |
| -------------- | ------------------- |
| **1. Was möchten Sie analysieren?** | Lead-Trends / Abschlussphasen / Anlagenauslastung |
| **2. Wo befinden sich die Daten?**   | Welche Sammlung, welche Felder            |
| **3. Wie möchten Sie es präsentieren?**  | Linien-, Trichter-, Kreisdiagramm, Vergleichstabelle        |

Sobald Sie diese Inhalte definiert haben, müssen Sie nur noch:

*   Die Analyselogik in die Vorlagensammlung schreiben;
*   Den Aufgaben-Prompt auf der Seite platzieren;
*   Und Viz kann Ihre Berichterstellung "übernehmen".

---

## 8. Fazit: Nehmen Sie das Paradigma mit

"Overall Analytics" und "SQL Execution" sind lediglich zwei Beispielimplementierungen.
Wichtiger ist die Idee dahinter:

> **Lassen Sie den KI-Mitarbeiter Ihre Geschäftslogik verstehen, anstatt nur Prompts auszuführen.**

Egal, ob Sie NocoBase, ein privates System oder einen selbst geschriebenen Workflow verwenden,
Sie können diese Struktur replizieren:

*   Zentralisierte Vorlagen;
*   Workflow-Aufrufe;
*   Schreibgeschützte Ausführung;
*   KI-Präsentation.

Auf diese Weise ist Viz nicht mehr nur eine "KI, die Diagramme erstellen kann",
sondern ein echter Analyst, der Ihre Daten, Ihre Definitionen und Ihr Geschäft versteht.