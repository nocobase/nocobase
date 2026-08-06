---
title: "LLM-Auswahl"
description: "Erkunden Sie Testergebnisse und Auswahlhinweise für den Aufbau von NocoBase-Anwendungen mit führenden Flaggschiffmodellen – auf Basis eines standardisierten Bewertungssystems, das Datenmodellierung, Seiten, Berechtigungen und Workflows abdeckt."
keywords: "NocoBase AI Builder,LLM-Auswahl,GPT,DeepSeek,Qwen,AI Agent,Modellbewertung"
---

# LLM-Auswahl

:::tip Wichtigste Erkenntnis

**Die derzeit marktführenden Flaggschiffmodelle können alle den Kern einer NocoBase-Anwendung aufbauen.**

Die Modelle unterscheiden sich hinsichtlich der Vollständigkeit ihrer ersten Ausgabe, der Aufbauzeit und der Anzahl der Probleme. Wählen Sie ein Modell anhand der bereits verfügbaren Modelldienste, der Netzwerkbedingungen in Ihrer Region, der Kosten und der Präferenzen Ihres Teams aus.

:::

Für diese Bewertung wurde ein standardisierter CRM-Anforderungskatalog (ein System zur Verwaltung von Verkaufschancen und zur Kundennachverfolgung) verwendet, um die von verschiedenen Modellen aufgebauten Anwendungen zu überprüfen:

| Bewertungsdimensionen | Standardisierte Prüfpunkte |
| :---: | :---: |
| 14 | 61 |

## Bewertungsdimensionen

Die Bewertung umfasst die Kernfunktionen, Konfigurationsmöglichkeiten und Basiskomponenten von NocoBase. Außerdem wird geprüft, ob jedes Modell die Anforderungen verstehen und die entsprechenden Aufbauaufgaben ausführen kann.

| Fähigkeit | Bewertungsschwerpunkt |
| --- | --- |
| Datenmodellierung | Collections, Feldtypen, Beziehungen, Pflichtfeld- und Eindeutigkeitsregeln sowie Standardwerte |
| Seiten und Funktionen | Navigation, Listen, Formulare, Detailansichten, Suche, Filter und Dashboards |
| Geschäftslogik | Statusübergänge, Geschäftsvalidierung, Berechnungsregeln und Konsistenz verknüpfter Daten |
| Berechtigungen und Sicherheit | Rollen, Menüberechtigungen, Aktionsberechtigungen, Datenbereiche und Feldberechtigungen |
| Workflow-Automatisierung | Trigger, Knoten, bedingte Verzweigungen, Benachrichtigungen, Datenseiteneffekte und Wiederholungsversuche bei Fehlern |
| Benutzerfreundlichkeit | Informationsarchitektur, Formularbedienung, Aktionsfeedback und responsive Layouts |
| Robustheit | Ungültige Eingaben, doppelte Übermittlungen, Konsistenz bei Fehlern, Datenvolumen und Wiederherstellung nach Netzwerkunterbrechungen |
| Anforderungsabdeckung | Ob explizite Anforderungen und zentrale Geschäftsabläufe vollständig umgesetzt sind |
| Sinnvolle Erweiterungen | Ob vom Modell proaktiv hinzugefügte Funktionen einem klaren Geschäftszweck dienen |
| Umfangskontrolle | Ob das Ergebnis doppelte, ungenutzte oder außerhalb des vorgesehenen Umfangs liegende Geschäftsmodule enthält |

## Bewertungsergebnisse

| Bewertungsdimension | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| Datenmodellierung | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| Funktionsvollständigkeit | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#d97706;font-weight:600">◐ Teilweise bestanden</span> |
| Geschäftslogik | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| Berechtigungen und Sicherheit | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| Workflow-Automatisierung | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| Benutzerfreundlichkeit | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#d97706;font-weight:600">◐ Teilweise bestanden</span> |
| Robustheit | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| Anforderungsabdeckung | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#d97706;font-weight:600">◐ Teilweise bestanden</span> |
| Sinnvolle Erweiterungen | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| Umfangskontrolle | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> | <span style="color:#15803d;font-weight:600">✓ Bestanden</span> |
| **Aufbaugeschwindigkeit** | <span style="color:#2563eb;font-weight:700">Relativ schnell</span> | <span style="color:#2563eb;font-weight:700">Relativ schnell</span> | <span style="color:#d97706;font-weight:700">Langsam</span> | <span style="color:#15803d;font-weight:700">Am schnellsten</span> |
| **Qualitätsbewertung eines einzelnen Durchlaufs** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip Qualitätsbewertung eines einzelnen Durchlaufs

Die Qualitätsbewertung eines einzelnen Durchlaufs hat eine Höchstpunktzahl von 100 Punkten. Für jeden bei der ersten vollständigen Abnahme gefundenen Fehler wird ein Punkt abgezogen. Der Wert gibt damit einen Anhaltspunkt für die Qualität des ersten Aufbaus durch das Modell. Durch anschließendes Feedback und weitere Überarbeitungen kann das Modell diese Probleme beheben.

:::

:::info Hinweis zur Aufbauzeit

Die Aufbauzeit wird unter anderem von der Hardwareleistung des Computers, der Installation von Abhängigkeiten und der Build-Kompilierung, der Antwortgeschwindigkeit des Modelldienstes sowie den Netzwerkbedingungen beeinflusst.

:::

## Details der Prüfpunkte

Die 61 standardisierten Prüfpunkte sind in drei Ebenen gegliedert: 46 Punkte für die Qualität des Aufbauergebnisses, 7 für das Verständnis der Anforderungen und sinnvolle Erweiterungen sowie 8 für die Effizienz des Aufbauprozesses. Für jeden Prüfpunkt gelten einheitliche Prüfmethoden und Bestehenskriterien.

### Ebene 1: Qualität des Aufbauergebnisses (46 Prüfpunkte)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Bewertungsdimension</th><th>Standardisierte Prüfpunkte</th></tr></thead>
  <tbody>
    <tr><td>Datenmodellierung (8 Prüfpunkte)</td><td><code>DM-01</code> Ob alle erforderlichen Collections erstellt wurden<br /><code>DM-02</code> Ob alle erforderlichen Felder vorhanden sind<br /><code>DM-03</code> Ob die Feldtypen korrekt sind<br /><code>DM-04</code> Ob Eins-zu-eins-Beziehungen erstellt und verwendet werden können<br /><code>DM-05</code> Ob Eins-zu-viele-Beziehungen erstellt und verwendet werden können<br /><code>DM-06</code> Ob Viele-zu-viele-Beziehungen erstellt und verwendet werden können<br /><code>DM-07</code> Ob Pflichtfeld-, Eindeutigkeits- und Standardwertregeln wirksam sind<br /><code>DM-08</code> Ob verknüpfte Daten angezeigt und gefiltert werden können</td></tr>
    <tr><td>Funktionsvollständigkeit (6 Prüfpunkte)</td><td><code>FC-01</code> Ob alle erforderlichen Seiten und Navigationseinträge vorhanden sind<br /><code>FC-02</code> Ob Datensätze erstellt, angezeigt, bearbeitet und gelöscht werden können<br /><code>FC-03</code> Ob zentrale Benutzerabläufe vollständig durchlaufen werden können<br /><code>FC-04</code> Ob wichtige Geschäftsaktionen verfügbar sind<br /><code>FC-05</code> Ob Suche, Filterung und Sortierung verfügbar sind<br /><code>FC-06</code> Ob Dashboards die erforderlichen Inhalte enthalten</td></tr>
    <tr><td>Geschäftslogik (6 Prüfpunkte)</td><td><code>BL-01</code> Ob die Regeln für Statusübergänge von Verkaufschancen korrekt sind<br /><code>BL-02</code> Ob die Geschäftsvalidierungsregeln wirksam sind<br /><code>BL-03</code> Ob berechnete Felder und statistische Definitionen korrekt sind<br /><code>BL-04</code> Ob Daten nach der Umwandlung eines Leads korrekt zugeordnet werden<br /><code>BL-05</code> Ob Aktualisierungen verknüpfter Datensätze konsistent bleiben<br /><code>BL-06</code> Ob Lösch- und Archivierungsregeln korrekt sind</td></tr>
    <tr><td>Berechtigungen und Sicherheit (7 Prüfpunkte)</td><td><code>ACL-01</code> Ob alle erforderlichen Rollen erstellt wurden<br /><code>ACL-02</code> Ob Testbenutzer und Rollenzuweisungen korrekt sind<br /><code>ACL-03</code> Ob die Zugriffsberechtigungen für Seiten und Menüs korrekt sind<br /><code>ACL-04</code> Ob die Berechtigungen für Datenoperationen korrekt sind<br /><code>ACL-05</code> Ob die Datenbereiche auf Datensatzebene korrekt sind<br /><code>ACL-06</code> Ob die Anzeige- und Bearbeitungsberechtigungen auf Feldebene korrekt sind<br /><code>ACL-07</code> Ob Rollenänderungen und kombinierte Rollen korrekt funktionieren</td></tr>
    <tr><td>Workflow-Automatisierung (7 Prüfpunkte)</td><td><code>WF-01</code> Ob alle erforderlichen Workflows erstellt und aktiviert wurden<br /><code>WF-02</code> Ob die Workflow-Trigger korrekt konzipiert sind<br /><code>WF-03</code> Ob die Reihenfolge der Knoten und die Datenübertragung korrekt sind<br /><code>WF-04</code> Ob Bedingungen und Verzweigungsergebnisse korrekt sind<br /><code>WF-05</code> Ob die Seiteneffekte beim Lesen und Schreiben von Datensätzen korrekt sind<br /><code>WF-06</code> Ob Empfänger und Inhalt von Benachrichtigungen korrekt sind<br /><code>WF-07</code> Ob Fehlerprotokolle und das Verhalten bei Wiederholungsversuchen nachvollziehbar sind</td></tr>
    <tr><td>Benutzerfreundlichkeit (7 Prüfpunkte)</td><td><code>UX-01</code> Ob Navigation und Informationsarchitektur klar sind<br /><code>UX-02</code> Ob Listeninformationen und häufige Aktionen einfach zu verwenden sind<br /><code>UX-03</code> Ob Gruppierung, Reihenfolge und Hinweise in Formularen klar sind<br /><code>UX-04</code> Ob Detailseiten das Verständnis und nachfolgende Aktionen unterstützen<br /><code>UX-05</code> Ob Aktionsfeedback und Statusänderungen klar sind<br /><code>UX-06</code> Ob die Anwendung bei verschiedenen Bildschirmbreiten nutzbar ist<br /><code>UX-07</code> Ob Leer-, Lade- und Fehlerzustände vollständig umgesetzt sind</td></tr>
    <tr><td>Robustheit (5 Prüfpunkte)</td><td><code>ROB-01</code> Ob ungültige Eingaben und Grenzwerte sicher verarbeitet werden<br /><code>ROB-02</code> Ob doppelte Übermittlungen doppelte Seiteneffekte verursachen<br /><code>ROB-03</code> Ob die Daten bei einem Ausführungsfehler konsistent bleiben<br /><code>ROB-04</code> Ob die Anwendung mit leeren und großen Datensätzen weiterhin nutzbar ist<br /><code>ROB-05</code> Ob sich die Anwendung nach einer Sitzungs- oder Netzwerkunterbrechung wiederherstellen kann</td></tr>
  </tbody>
</table>

### Ebene 2: Anforderungsverständnis und sinnvolle Erweiterungen (7 Prüfpunkte)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Bewertungsdimension</th><th>Standardisierte Prüfpunkte</th></tr></thead>
  <tbody>
    <tr><td>Anforderungsabdeckung (3 Prüfpunkte)</td><td><code>COV-01</code> Ob alle im Prompt angeforderten Seiten und Aktionen umgesetzt sind<br /><code>COV-02</code> Ob alle im Prompt angeforderten Daten, Berechtigungen und Workflows umgesetzt sind<br /><code>COV-03</code> Ob die für den Hauptprozess erforderlichen, aber im Prompt nicht einzeln genannten Funktionen vorhanden sind</td></tr>
    <tr><td>Sinnvolle Erweiterungen (2 Prüfpunkte)</td><td><code>EXT-01</code> Ob proaktiv hinzugefügte Felder, Beziehungen und Regeln erforderlich sind<br /><code>EXT-02</code> Ob proaktiv hinzugefügte Seiten, Aktionen und Statistiken einem klaren Zweck dienen</td></tr>
    <tr><td>Umfangskontrolle (2 Prüfpunkte)</td><td><code>SCOPE-01</code> Ob doppelte oder ungenutzte Funktionen und Konfigurationen erzeugt werden<br /><code>SCOPE-02</code> Ob Geschäftsmodule hinzugefügt werden, die nicht zum Aufgabenbereich gehören</td></tr>
  </tbody>
</table>

### Ebene 3: Effizienz des Aufbauprozesses (8 Prüfpunkte)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Bewertungsdimension</th><th>Standardisierte Prüfpunkte</th></tr></thead>
  <tbody>
    <tr><td>Zeit bis zum ersten nutzbaren Ergebnis (1 Prüfpunkt)</td><td><code>EFF-FIRST-01</code> Benötigte Zeit bis zum ersten nutzbaren Ergebnis</td></tr>
    <tr><td>Konvergenzeffizienz (3 Prüfpunkte)</td><td><code>EFF-FINAL-01</code> Anzahl der Iterationen bis zur endgültigen Abnahme<br /><code>EFF-FINAL-02</code> Gesamtdauer bis zum Erreichen des Endzustands<br /><code>EFF-FINAL-03</code> Token-Verbrauch bis zum Erreichen des Endzustands</td></tr>
    <tr><td>Manuelle Eingriffe (1 Prüfpunkt)</td><td><code>EFF-HUMAN-01</code> Anzahl der manuellen Eingriffe während der Bewertung</td></tr>
    <tr><td>Wiederholbarkeit (3 Prüfpunkte)</td><td><code>EFF-STABLE-01</code> Ob wiederholte Ausführungen derselben Aufgabe zu konsistenten Abnahmeergebnissen führen<br /><code>EFF-STABLE-02</code> Ob Collections, Beziehungen, Rollen und Workflows über drei Durchläufe hinweg konsistent sind<br /><code>EFF-STABLE-03</code> Ob Schwankungen bei der Anzahl der Iterationen und der benötigten Zeit kontrolliert bleiben</td></tr>
  </tbody>
</table>

## Nächste Schritte

- [Gemeinsamer Aufbau mit einem AI Agent](./agent-workflow.md) – Beschreiben Sie Seiten und Interaktionen in natürlicher Sprache und entwickeln Sie sie kontinuierlich mit einem AI Agent weiter
- [AI Portal-Schnellstart](./index.md) – Erstellen und starten Sie Ihr erstes AI Portal
- [Datenmodellierung](../data-modeling.md) – Erstellen Sie Collections, Felder und Beziehungen mit natürlicher Sprache
- [Workflow-Verwaltung](../workflow.md) – Erstellen, bearbeiten, aktivieren und diagnostizieren Sie Workflows
- [Berechtigungskonfiguration](../acl.md) – Verwalten Sie Rollen, Berechtigungsrichtlinien, Benutzerzuweisungen und Risikobewertungen
