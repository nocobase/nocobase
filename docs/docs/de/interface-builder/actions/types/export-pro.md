---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Export Pro

## Einführung

Das Export Pro Plugin erweitert die Standard-Exportfunktion um verbesserte Möglichkeiten.

## Installation

Dieses Plugin benötigt das Plugin für die Verwaltung asynchroner Aufgaben. Bevor Sie es verwenden können, müssen Sie das Plugin für die Verwaltung asynchroner Aufgaben aktivieren.

## Funktionserweiterungen

- Unterstützt asynchrone Exportvorgänge, die in einem separaten Thread ausgeführt werden und den Export großer Datenmengen ermöglichen.
- Unterstützt den Export von Anhängen.

## Benutzerhandbuch

### Exportmodus konfigurieren

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Über die Export-Schaltfläche können Sie den Exportmodus konfigurieren. Es stehen drei Modi zur Auswahl:

- **Automatisch**: Der Exportmodus wird anhand der Datenmenge zum Zeitpunkt des Exports bestimmt. Wenn die Anzahl der Datensätze weniger als 1000 (oder 100 bei Anhang-Exports) beträgt, wird der synchrone Export verwendet. Bei mehr als 1000 Datensätzen (oder 100 bei Anhang-Exports) kommt der asynchrone Export zum Einsatz.
- **Synchron**: Verwendet den synchronen Export, der im Haupt-Thread ausgeführt wird. Dies ist für kleinere Datenmengen geeignet. Der Export großer Datenmengen im synchronen Modus kann zu Systemblockaden, Verzögerungen und der Unfähigkeit führen, andere Benutzeranfragen zu bearbeiten.
- **Asynchron**: Verwendet den asynchronen Export, der in einem separaten Hintergrund-Thread ausgeführt wird und die Nutzung des Systems nicht blockiert.

### Asynchroner Export

Nach dem Start eines Exports wird der Vorgang in einem separaten Hintergrund-Thread ausgeführt, ohne dass eine manuelle Konfiguration durch den Benutzer erforderlich ist. In der Benutzeroberfläche wird nach dem Auslösen eines Exports die aktuell laufende Exportaufgabe oben rechts angezeigt, inklusive des Echtzeit-Fortschritts.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Nach Abschluss des Exports können Sie die exportierte Datei in den Exportaufgaben herunterladen.

#### Parallele Exporte
Eine große Anzahl paralleler Exportaufgaben kann die Serverkonfiguration beeinflussen und zu einer Verlangsamung der Systemantwort führen. Daher wird Systementwicklern empfohlen, die maximale Anzahl paralleler Exportaufgaben zu konfigurieren (Standard ist 3). Wenn die konfigurierte Anzahl überschritten wird, werden neue Aufgaben in eine Warteschlange gestellt.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Konfiguration der Parallelität: Umgebungsvariable `ASYNC_TASK_MAX_CONCURRENCY=Anzahl`

Basierend auf umfassenden Tests mit verschiedenen Konfigurationen und Datenkomplexitäten werden folgende Parallelitätswerte empfohlen:
- 2-Kern-CPU: 3 parallele Aufgaben.
- 4-Kern-CPU: 5 parallele Aufgaben.

#### Zur Leistung
Wenn Sie feststellen, dass der Exportvorgang ungewöhnlich langsam ist (siehe untenstehende Referenz), könnte dies an der Struktur der Sammlung liegen.

| Datenmerkmale | Indextyp | Datenmenge | Exportdauer |
|---------|---------|--------|---------|
| Keine Beziehungsfelder | Primärschlüssel / Eindeutiger Constraint | 1 Million | 3～6 Minuten |  
| Keine Beziehungsfelder | Regulärer Index | 1 Million | 6～10 Minuten | 
| Keine Beziehungsfelder | Verbundindex (nicht eindeutig) | 1 Million | 30 Minuten | 
| Beziehungsfelder<br>(Eins-zu-Eins, Eins-zu-Viele,<br>Viele-zu-Eins, Viele-zu-Viele) | Primärschlüssel / Eindeutiger Constraint | 500.000 | 15～30 Minuten | Beziehungsfelder verringern die Leistung |

Um einen effizienten Export zu gewährleisten, empfehlen wir Ihnen:
1. Die Sammlung muss die folgenden Bedingungen erfüllen:

| Bedingungstyp | Erforderliche Bedingung | Weitere Hinweise |
|---------|------------------------|------|
| Sammlungsstruktur (mindestens eine erfüllen) | Verfügt über einen Primärschlüssel<br>Verfügt über einen eindeutigen Constraint<br>Verfügt über einen Index (eindeutig, regulär, Verbund) | Priorität: Primärschlüssel > Eindeutiger Constraint > Index
| Feldeigenschaften | Der Primärschlüssel / Eindeutige Constraint / Index (einer davon) muss sortierbare Eigenschaften aufweisen, wie z.B.: Auto-Inkrement-ID, Snowflake ID, UUID v1, Zeitstempel, Zahl usw.<br>(Hinweis: Nicht sortierbare Felder wie UUID v3/v4/v5, normale Zeichenketten usw. beeinträchtigen die Leistung) | Keine |

2. Reduzieren Sie die Anzahl der unnötig zu exportierenden Felder, insbesondere Beziehungsfelder (Leistungsprobleme durch Beziehungsfelder werden noch optimiert).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Wenn der Export trotz Erfüllung der oben genannten Bedingungen weiterhin langsam ist, können Sie die Protokolle analysieren oder sich an das offizielle Team wenden.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Verknüpfungsregel](/interface-builder/actions/action-settings/linkage-rule): Schaltfläche dynamisch anzeigen/ausblenden;
- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Titel, Typ und Symbol der Schaltfläche bearbeiten;