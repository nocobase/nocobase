---
pkg: '@nocobase/plugin-ai'
title: 'Skills für KI-Mitarbeiter'
description: 'Skills sind die Fachwissen-Leitfäden für KI-Mitarbeiter: General Skills, Employee-specific Skills.'
keywords: 'KI-Mitarbeiter Skills,Skills,NocoBase'
---

# Skills verwenden

Skills sind Fachwissen-Leitfäden für KI-Mitarbeiter, die KI-Mitarbeiter dabei anleiten, mehrere Tools zur Bewältigung von Fachaufgaben einzusetzen.

Derzeit unterstützen Skills keine Anpassung und sind nur als Systemvorlagen verfügbar.

## Skills-Struktur

Die Skills-Seite ist in zwei Kategorien unterteilt:

1. `General skills`: Werden von allen KI-Mitarbeitern gemeinsam genutzt, in der Regel schreibgeschützt.
2. `Employee-specific skills`: Spezifisch für den jeweils aktuellen Mitarbeiter.

![](https://static-docs.nocobase.com/202604230832639.png)

## Skills-Übersicht

### Allgemeine Skills

| Skill-Name               | Funktionsbeschreibung                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Data metadata            | Ruft Metadaten des System-Datenmodells, Datentabellen, Felder usw. ab, um KI-Mitarbeitern das Verständnis des Geschäftskontexts zu ermöglichen. |
| Data query               | Fragt Daten in Datentabellen ab, unterstützt Bedingungsfilter, Aggregationsabfragen usw. und hilft KI-Mitarbeitern, Geschäftsdaten zu erhalten. |
| Business analysis report | Erstellt Analyseberichte basierend auf Geschäftsdaten, unterstützt mehrdimensionale Analysen und Visualisierungen, um KI-Mitarbeitern Geschäftseinblicke zu ermöglichen. |
| Document search          | Durchsucht und liest voreingestellte Dokumentinhalte und hilft KI-Mitarbeitern bei der Bearbeitung dokumentbasierter Aufgaben, derzeit hauptsächlich beim Schreiben von JS-Code. |

### Spezifische Skills

| Skill-Name         | Funktionsbeschreibung                                       | Zugehöriger Mitarbeiter |
| ------------------ | ----------------------------------------------------------- | ----------------------- |
| Data modeling      | Datenmodellierungs-Skill, Verständnis und Aufbau von Geschäftsdatenmodellen | Orin                    |
| Frontend developer | Schreibt und testet JS-Code für Frontend-Blöcke             | Nathan                  |
