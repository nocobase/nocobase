:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Freigabemanagement

## Einführung

In der Praxis werden, um die Datensicherheit und die Stabilität von Anwendungen zu gewährleisten, üblicherweise mehrere Umgebungen bereitgestellt, wie zum Beispiel eine Entwicklungsumgebung, eine Vorproduktionsumgebung und eine Produktionsumgebung. Dieses Dokument stellt zwei gängige No-Code-Entwicklungsprozesse vor und erläutert detailliert, wie Sie das Freigabemanagement in NocoBase umsetzen können.

## Installation

Für das Freigabemanagement sind drei Plugins unerlässlich. Bitte stellen Sie sicher, dass die folgenden Plugins aktiviert sind.

### Variablen und Schlüssel

- Integriertes Plugin, standardmäßig installiert und aktiviert.
- Es ermöglicht die zentrale Konfiguration und Verwaltung von Umgebungsvariablen und Schlüsseln. Dies wird für die Speicherung sensibler Daten, die Wiederverwendung von Konfigurationsdaten und die Isolierung von Umgebungskonfigurationen genutzt. ([Dokumentation ansehen](#))

### Backup-Manager

- Dieses Plugin ist nur in der Professional Edition oder höheren Versionen verfügbar ([Mehr erfahren](https://www.nocobase.com/en/commercial)).
- Es bietet Funktionen für Sicherung und Wiederherstellung, einschließlich geplanter Backups, um Datensicherheit und schnelle Wiederherstellung zu gewährleisten. ([Dokumentation ansehen](../backup-manager/index.mdx))

### Migrations-Manager

- Dieses Plugin ist nur in der Professional Edition oder höheren Versionen verfügbar ([Mehr erfahren](https://www.nocobase.com/en/commercial)).
- Es wird verwendet, um Anwendungskonfigurationen von einer Anwendungsumgebung in eine andere zu migrieren. ([Dokumentation ansehen](../migration-manager/index.md))

## Gängige No-Code-Entwicklungsprozesse

### Einzelne Entwicklungsumgebung, unidirektionale Freigabe

Dieser Ansatz eignet sich für einfache Entwicklungsprozesse. Es gibt jeweils eine Entwicklungsumgebung, eine Vorproduktionsumgebung und eine Produktionsumgebung. Änderungen werden nacheinander von der Entwicklungsumgebung in die Vorproduktionsumgebung und schließlich in die Produktionsumgebung überführt. In diesem Prozess können Konfigurationen nur in der Entwicklungsumgebung geändert werden; weder die Vorproduktions- noch die Produktionsumgebung erlauben Änderungen.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Beim Konfigurieren der Migrationsregeln wählen Sie für die integrierten Tabellen des Kerns und der Plugins die Regel „Überschreiben bevorzugen“. Für alle anderen können Sie die Standardeinstellungen beibehalten, sofern keine besonderen Anforderungen bestehen.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Mehrere Entwicklungsumgebungen, zusammengeführte Freigabe

Dieser Ansatz eignet sich für die Zusammenarbeit mehrerer Personen oder für komplexe Projekte. Mehrere parallele Entwicklungsumgebungen können unabhängig voneinander genutzt werden, und alle Änderungen werden in einer einzigen Vorproduktionsumgebung für Tests und Validierungen zusammengeführt, bevor sie in die Produktion überführt werden. Auch in diesem Prozess können Konfigurationen nur in der Entwicklungsumgebung geändert werden; weder die Vorproduktions- noch die Produktionsumgebung erlauben Änderungen.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Beim Konfigurieren der Migrationsregeln wählen Sie für die integrierten Tabellen des Kerns und der Plugins die Regel „Einfügen oder Aktualisieren bevorzugen“. Für alle anderen können Sie die Standardeinstellungen beibehalten, sofern keine besonderen Anforderungen bestehen.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Rollback

Vor der Ausführung einer Migration erstellt das System automatisch ein Backup der aktuellen Anwendung. Sollte die Migration fehlschlagen oder die Ergebnisse nicht den Erwartungen entsprechen, können Sie über den [Backup-Manager](../backup-manager/index.mdx) ein Rollback durchführen und den vorherigen Zustand wiederherstellen.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)