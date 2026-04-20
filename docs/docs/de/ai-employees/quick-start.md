:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/quick-start).
:::

# Schnellstart

Richten Sie in nur 5 Minuten eine minimal einsatzfähige Konfiguration für AI-Mitarbeiter ein.

## Plugin installieren

AI-Mitarbeiter sind ein integriertes Plugin von NocoBase (`@nocobase/plugin-ai`), daher ist keine separate Installation erforderlich.

## LLM-Dienste konfigurieren

Sie können LLM-Dienste über einen der folgenden Zugänge konfigurieren:

1. Administration: `Systemeinstellungen -> AI-Mitarbeiter -> LLM-Dienst`.
2. Frontend-Schnellzugriff: Wenn Sie im AI-Chat-Panel den `Model Switcher` zur Modellauswahl verwenden, klicken Sie auf den Schnellzugriff „LLM-Dienst hinzufügen“, um direkt dorthin zu gelangen.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

In der Regel müssen Sie Folgendes bestätigen:
1. Provider auswählen.
2. API-Key eingeben.
3. `Aktivierte Modelle` konfigurieren; standardmäßig können Sie einfach „Recommend“ verwenden.

## Integrierte Mitarbeiter aktivieren

Die integrierten AI-Mitarbeiter sind standardmäßig aktiviert und müssen normalerweise nicht einzeln manuell eingeschaltet werden.

Wenn Sie den Verfügbarkeitsbereich anpassen möchten (einen bestimmten Mitarbeiter aktivieren/deaktivieren), können Sie den Schalter `Aktiviert` auf der Listenseite unter `Systemeinstellungen -> AI-Mitarbeiter` ändern.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Zusammenarbeit starten

Bewegen Sie auf der Anwendungsseite den Mauszeiger über den Schnellzugriff unten rechts und wählen Sie einen AI-Mitarbeiter aus.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Klicken Sie hier, um das AI-Dialogfenster zu öffnen:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Sie können außerdem:  
* Blöcke hinzufügen
* Anhänge hinzufügen
* Websuche aktivieren
* AI-Mitarbeiter wechseln
* Modell auswählen

Diese können auch automatisch die Seitenstruktur als Kontext erfassen. Beispielsweise erkennt Dex in einem Formularblock automatisch die Feldstruktur des Formulars und ruft die passenden Fähigkeiten auf, um Aktionen auf der Seite auszuführen.

## Schnellaufgaben 

Sie können für jeden AI-Mitarbeiter an der aktuellen Position häufig genutzte Aufgaben voreinstellen. So können Sie die Arbeit mit nur einem Klick starten – schnell und komfortabel.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Übersicht der integrierten Mitarbeiter

NocoBase bietet mehrere vordefinierte AI-Mitarbeiter für verschiedene Szenarien an.

Sie müssen lediglich:

1. LLM-Dienste konfigurieren.
2. Aktivierungsstatus der Mitarbeiter nach Bedarf anpassen (standardmäßig aktiviert).
3. Modell im Chat auswählen und mit der Zusammenarbeit beginnen.

| Name des Mitarbeiters | Rollenpositionierung | Kernkompetenzen |
| :--- | :--- | :--- |
| **Cole** | NocoBase-Assistent | Fragen und Antworten zur Produktnutzung, Dokumentenabruf |
| **Ellis** | E-Mail-Experte | Schreiben von E-Mails, Zusammenfassungen, Antwortvorschläge |
| **Dex** | Datenorganisator | Feldübersetzung, Formatierung, Informationsextraktion |
| **Viz** | Insight-Analyst | Dateneinblicke, Trendanalysen, Interpretation von Kennzahlen |
| **Lexi** | Übersetzungsassistent | Mehrsprachige Übersetzung, Kommunikationshilfe |
| **Vera** | Recherche-Analyst | Websuche, Informationsaggregation, Tiefenrecherche |
| **Dara** | Datenvisualisierungsexperte | Diagrammkonfiguration, Erstellung visueller Berichte |
| **Orin** | Datenmodellierungsexperte | Unterstützung beim Entwurf von Sammlungsstrukturen, Feldvorschläge |
| **Nathan** | Frontend-Entwickler | Unterstützung beim Schreiben von Frontend-Code-Snippets, Stilanpassungen |

**Anmerkungen**

Einige integrierte AI-Mitarbeiter erscheinen nicht in der Liste unten rechts, da sie über exklusive Einsatzszenarien verfügen:

- Orin: Datenmodellierungsseite.
- Dara: Diagrammkonfigurations-Blöcke.
- Nathan: JS-Block und ähnliche Code-Editoren.