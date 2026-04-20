:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/configuration/admin-configuration).
:::

# KI-Mitarbeiter · Konfigurationshandbuch für Administratoren

> Dieses Dokument hilft Ihnen dabei, schnell zu verstehen, wie Sie KI-Mitarbeiter konfigurieren und verwalten, und führt Sie Schritt für Schritt durch den gesamten Prozess, vom Modell-Service bis zum Arbeitseinsatz.


## I. Bevor Sie beginnen

### 1. Systemanforderungen

Stellen Sie vor der Konfiguration sicher, dass Ihre Umgebung die folgenden Bedingungen erfüllt:

*   **NocoBase 2.0 oder höher** ist installiert
*   Das **KI-Mitarbeiter-Plugin** ist aktiviert
*   Mindestens ein verfügbarer **Large Language Model (LLM) Service** (z. B. OpenAI, Claude, DeepSeek, GLM usw.)


### 2. Das zweistufige Design von KI-Mitarbeitern verstehen

KI-Mitarbeiter sind in zwei Ebenen unterteilt: **„Rollendefinition“** und **„Aufgabenanpassung“**.

| Ebene | Beschreibung | Merkmale | Funktion |
| -------- | ------------ | ---------- | ------- |
| **Rollendefinition** | Grundlegende Persönlichkeit und Kernfähigkeiten des Mitarbeiters | Stabil und unveränderlich, wie ein „Lebenslauf“ | Gewährleistet Rollenkonsistenz |
| **Aufgabenanpassung** | Konfiguration für verschiedene Geschäftsszenarien | Flexibel anpassbar | Passt sich spezifischen Aufgaben an |

**Einfach ausgedrückt:**

> „Rollendefinition“ bestimmt, wer dieser Mitarbeiter ist,
> „Aufgabenanpassung“ bestimmt, was er aktuell tun soll.

Die Vorteile dieses Designs sind:

*   Die Rolle bleibt konstant, kann aber verschiedene Szenarien bewältigen
*   Das Aktualisieren oder Ersetzen von Aufgaben hat keinen Einfluss auf den Mitarbeiter selbst
*   Hintergrund und Aufgaben sind unabhängig voneinander, was die Wartung erleichtert


## II. Konfigurationsprozess (in 5 Schritten)

### Schritt 1: Modell-Service konfigurieren

Der Modell-Service ist wie das Gehirn eines KI-Mitarbeiters und muss zuerst eingerichtet werden.

> 💡 Detaillierte Konfigurationsanweisungen finden Sie unter: [LLM-Service konfigurieren](/ai-employees/features/llm-service)

**Pfad:**
`Systemeinstellungen → KI-Mitarbeiter → LLM service`

![Konfigurationsseite aufrufen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klicken Sie auf **Hinzufügen** und geben Sie die folgenden Informationen ein:

| Element | Beschreibung | Hinweise |
| ------ | -------------------------- | --------- |
| Provider | z. B. OpenAI, Claude, Gemini, Kimi usw. | Kompatibel mit Services derselben Spezifikation |
| API-Key | Der vom Serviceanbieter bereitgestellte Schlüssel | Geheim halten und regelmäßig ändern |
| Base URL | API-Endpunkt (optional) | Muss bei Verwendung eines Proxys geändert werden |
| Enabled Models | Empfohlene Modelle / Modelle auswählen / Manuelle Eingabe | Bestimmt die im Chat verfügbaren Modelle |

![Großen Modell-Service erstellen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Nach der Konfiguration verwenden Sie bitte `Test flight`, um die **Verbindung zu testen**.
Sollte dies fehlschlagen, überprüfen Sie bitte das Netzwerk, den Schlüssel oder den Modellnamen.

![Verbindung testen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Schritt 2: KI-Mitarbeiter erstellen

> 💡 Detaillierte Anweisungen finden Sie unter: [KI-Mitarbeiter erstellen](/ai-employees/features/new-ai-employees)

Pfad: `KI-Mitarbeiter-Verwaltung → Mitarbeiter erstellen`

Füllen Sie die grundlegenden Informationen aus:

| Feld | Erforderlich | Beispiel |
| ----- | -- | -------------- |
| Name | ✓ | viz, dex, cole |
| Spitzname | ✓ | Viz, Dex, Cole |
| Aktivierungsstatus | ✓ | Aktiviert |
| Kurzbiografie | - | „Datenanalyse-Experte“ |
| Haupt-Prompt | ✓ | Siehe Prompt Engineering Guide |
| Begrüßung | - | „Hallo, ich bin Viz…“ |

![Grundlegende Informationskonfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

In der Erstellungsphase des Mitarbeiters werden hauptsächlich Rollen- und Fähigkeitskonfigurationen abgeschlossen. Das tatsächlich verwendete Modell kann im Chat über den `Model Switcher` ausgewählt werden.

**Vorschläge zur Prompt-Erstellung:**

*   Beschreiben Sie klar die Rolle, den Ton und die Verantwortlichkeiten des Mitarbeiters
*   Verwenden Sie Wörter wie „muss“ oder „darf niemals“, um Regeln zu betonen
*   Versuchen Sie Beispiele einzubeziehen, um abstrakte Erklärungen zu vermeiden
*   Halten Sie die Länge zwischen 500 und 1000 Zeichen

> Je klarer der Prompt, desto stabiler ist die Leistung der KI.
> Sie können sich am [Prompt Engineering Guide](./prompt-engineering-guide.md) orientieren.


### Schritt 3: Fähigkeiten konfigurieren

Fähigkeiten bestimmen, was ein Mitarbeiter „tun kann“.

> 💡 Detaillierte Anweisungen finden Sie unter: [Fähigkeiten](/ai-employees/features/tool)

| Typ | Fähigkeitsbereich | Beispiel | Risikostufe |
| ---- | ------- | --------- | ------ |
| Frontend | Seiteninteraktion | Blockdaten lesen, Formulare ausfüllen | Niedrig |
| Datenmodell | Datenabfrage und -analyse | Aggregierte Statistiken | Mittel |
| Workflow | Geschäftsprozesse ausführen | Benutzerdefinierte Tools | Abhängig vom Workflow |
| Sonstiges | Externe Erweiterungen | Websuche, Dateivorgänge | Je nach Situation |

**Konfigurationsvorschläge:**

*   3–5 Fähigkeiten pro Mitarbeiter sind am besten geeignet
*   Es wird nicht empfohlen, alles auszuwählen, da dies zu Verwirrung führen kann
*   Für wichtige Vorgänge wird die Berechtigung `Ask` anstelle von `Allow` empfohlen

![Fähigkeiten konfigurieren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Schritt 4: Wissensdatenbank konfigurieren (Optional)

Wenn Ihr KI-Mitarbeiter eine große Menge an Material wie Produkthandbücher, FAQs usw. speichern oder referenzieren muss, können Sie eine Wissensdatenbank konfigurieren.

> 💡 Detaillierte Anweisungen finden Sie unter:
> - [Übersicht über KI-Wissensdatenbanken](/ai-employees/knowledge-base/index)
> - [Vektordatenbank](/ai-employees/knowledge-base/vector-database)
> - [Wissensdatenbank-Konfiguration](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Dies erfordert die zusätzliche Installation des Vektordatenbank-Plugins.

![Wissensdatenbank konfigurieren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Anwendbare Szenarien:**

*   Damit die KI Unternehmenswissen versteht
*   Unterstützung von Dokumenten-Q&A und -Abfragen
*   Training von domänenspezifischen Assistenten


### Schritt 5: Ergebnis überprüfen

Nach Abschluss sehen Sie den Avatar des neuen Mitarbeiters in der unteren rechten Ecke der Seite.

![Konfiguration überprüfen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Bitte überprüfen Sie jeden Punkt:

*   ✅ Wird das Symbol korrekt angezeigt?
*   ✅ Kann eine grundlegende Konversation geführt werden?
*   ✅ Können Fähigkeiten korrekt aufgerufen werden?

Wenn alles passt, war die Konfiguration erfolgreich 🎉


## III. Aufgabenkonfiguration: KI in den Einsatz bringen

Bisher wurde der „Mitarbeiter erstellt“,
als Nächstes geht es darum, ihn „arbeiten zu lassen“.

KI-Aufgaben definieren das Verhalten des Mitarbeiters auf einer bestimmten Seite oder in einem Block.

> 💡 Detaillierte Anweisungen finden Sie unter: [Aufgaben](/ai-employees/features/task)


### 1. Seitenbezogene Aufgaben

Anwendbar auf den gesamten Seitenbereich, z. B. „Daten auf dieser Seite analysieren“.

**Konfigurationseinstieg:**
`Seiteneinstellungen → KI-Mitarbeiter → Aufgabe hinzufügen`

| Feld | Beschreibung | Beispiel |
| ---- | -------- | --------- |
| Titel | Aufgabenname | Phasenkonversionsanalyse |
| Kontext | Kontext der aktuellen Seite | Leads-Listenansicht |
| Standardnachricht | Voreingestellter Dialog | „Bitte analysieren Sie die Trends dieses Monats“ |
| Standard-Block | Automatische Verknüpfung mit Sammlung | Leads-Tabelle |
| Fähigkeiten | Verfügbare Tools | Daten abfragen, Diagramme generieren |

![Seitenbezogene Aufgabenkonfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Unterstützung für mehrere Aufgaben:**
Einem KI-Mitarbeiter können mehrere Aufgaben zugewiesen werden, die dem Benutzer als Optionen zur Auswahl stehen:

![Unterstützung für mehrere Aufgaben](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Vorschläge:

*   Eine Aufgabe sollte sich auf ein Ziel konzentrieren
*   Der Name sollte klar und verständlich sein
*   Die Anzahl der Aufgaben sollte auf 5–7 begrenzt sein


### 2. Blockbezogene Aufgaben

Geeignet für die Bearbeitung eines bestimmten Blocks, z. B. „Aktuelles Formular übersetzen“.

**Konfigurationsmethode:**

1.  Öffnen Sie die Block-Aktionskonfiguration
2.  Fügen Sie „KI-Mitarbeiter“ hinzu

![KI-Mitarbeiter-Schaltfläche hinzufügen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Binden Sie den Zielmitarbeiter ein

![KI-Mitarbeiter auswählen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Blockbezogene Aufgabenkonfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-