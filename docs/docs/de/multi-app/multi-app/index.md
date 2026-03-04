---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/multi-app/multi-app/index).
:::

# Multi-App-Verwaltung

## Funktionsübersicht

Die Multi-App-Verwaltung ist eine von NocoBase bereitgestellte einheitliche Anwendungsverwaltungslösung zum Erstellen und Verwalten mehrerer physisch isolierter NocoBase-Anwendungsinstanzen in einer oder mehreren Laufzeitumgebungen. Über den App-Supervisor (AppSupervisor) können Sie mehrere Anwendungen über einen einheitlichen Einstiegspunkt erstellen und warten, um den Anforderungen verschiedener Geschäftsbereiche und Skalierungsphasen gerecht zu werden.

## Einzelne Anwendung

In der Anfangsphase eines Projekts beginnen die meisten Benutzer mit einer einzelnen Anwendung.

In diesem Modus muss das System nur eine NocoBase-Instanz bereitstellen, und alle Geschäftsfunktionen, Daten und Benutzer laufen in derselben Anwendung. Die Bereitstellung ist einfach, die Konfigurationskosten sind niedrig, und es eignet sich sehr gut für die Prototyp-Validierung, kleine Projekte oder interne Werkzeuge.

Doch mit zunehmender Komplexität des Geschäfts stößt eine einzelne Anwendung an natürliche Grenzen:

- Funktionen werden ständig hinzugefügt, wodurch das System aufgebläht wird
- Die Isolierung zwischen verschiedenen Geschäftsbereichen ist schwierig
- Die Kosten für die Erweiterung und Wartung der Anwendung steigen kontinuierlich

Zu diesem Zeitpunkt werden Sie wünschen, verschiedene Geschäftsbereiche in mehrere Anwendungen aufzuteilen, um die Wartbarkeit und Erweiterbarkeit des Systems zu verbessern.

## Shared-Memory-Multi-App

Wenn Sie das Geschäft aufteilen möchten, aber keine komplexen Bereitstellungs- und Betriebsarchitekturen einführen wollen, können Sie auf den Shared-Memory-Multi-App-Modus aktualisieren.

In diesem Modus können mehrere Anwendungen gleichzeitig in einer NocoBase-Instanz ausgeführt werden. Jede Anwendung ist unabhängig, kann mit einer unabhängigen Datenbank verbunden werden, kann separat erstellt, gestartet und gestoppt werden, aber sie teilen sich denselben Prozess und Speicherplatz. Sie müssen weiterhin nur eine NocoBase-Instanz warten.

![](https://static-docs.nocobase.com/202512231055907.png)

Dieser Ansatz bringt deutliche Verbesserungen:

- Geschäftsbereiche können nach Anwendungsdimensionen aufgeteilt werden
- Funktionen und Konfigurationen zwischen Anwendungen sind klarer
- Im Vergleich zu Multi-Prozess- oder Multi-Container-Lösungen ist der Ressourcenverbrauch geringer

Da jedoch alle Anwendungen im selben Prozess laufen, teilen sie sich Ressourcen wie CPU und Arbeitsspeicher. Eine Anomalie oder hohe Last in einer einzelnen Anwendung kann die Stabilität anderer Anwendungen beeinträchtigen.

Wenn die Anzahl der Anwendungen weiter zunimmt oder höhere Anforderungen an Isolierung und Stabilität gestellt werden, muss die Architektur weiter aktualisiert werden.

## Hybride Bereitstellung in mehreren Umgebungen

Wenn der Geschäftsumfang und die Komplexität ein bestimmtes Niveau erreichen und die Anzahl der Anwendungen in großem Maßstab erweitert werden muss, steht der Shared-Memory-Multi-App-Modus vor Herausforderungen wie Ressourcenkonflikten, Stabilität und Sicherheit. In der Skalierungsphase können Sie eine hybride Bereitstellung in mehreren Umgebungen in Betracht ziehen, um komplexere Geschäftsszenarien zu unterstützen.

Der Kern dieser Architektur ist die Einführung einer Einstiegsanwendung, d. h. die Bereitstellung eines NocoBase als einheitliches Verwaltungszentrum, während gleichzeitig mehrere NocoBase-Instanzen als Anwendungslaufzeitumgebungen zur tatsächlichen Ausführung der Geschäftsanwendungen bereitgestellt werden.

Die Einstiegsanwendung ist verantwortlich für:

- Erstellung, Konfiguration und Lebenszyklusmanagement von Anwendungen
- Ausgabe von Verwaltungsbefehlen und Statuszusammenfassung

Die Instanz-Anwendungsumgebung ist verantwortlich für:

- Tatsächliches Hosten und Ausführen von Geschäftsanwendungen über den Shared-Memory-Multi-App-Modus

Für Sie können mehrere Anwendungen weiterhin über einen einzigen Einstiegspunkt erstellt und verwaltet werden, aber intern gilt:

- Verschiedene Anwendungen können auf verschiedenen Knoten oder Clustern laufen
- Jede Anwendung kann unabhängige Datenbanken und Middleware verwenden
- Hochlast-Anwendungen können nach Bedarf erweitert oder isoliert werden

![](https://static-docs.nocobase.com/202512231215186.png)

Dieser Ansatz eignet sich für SaaS-Plattformen, eine große Anzahl von Demo-Umgebungen oder Multi-Mandanten-Szenarien. Er gewährleistet Flexibilität und verbessert gleichzeitig die Stabilität und Wartbarkeit des Systems.