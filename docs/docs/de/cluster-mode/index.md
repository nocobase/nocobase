:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Cluster-Modus

## Einführung

Ab Version v1.6.0 unterstützt NocoBase das Ausführen von Anwendungen im Cluster-Modus. Wenn eine Anwendung im Cluster-Modus läuft, kann sie ihre Leistung bei der Verarbeitung gleichzeitiger Zugriffe verbessern, indem sie mehrere Instanzen und einen Mehrkern-Modus nutzt.

Auf Basis des Cluster-Modus lässt sich Hochverfügbarkeit auf Anwendungsebene erreichen: Ein Load Balancer verteilt den Datenverkehr auf mehrere NocoBase-Instanzen innerhalb desselben Clusters, sodass bei Ausfall, Neustart oder Bereitstellung einer einzelnen Instanz andere Instanzen den Dienst weiter bereitstellen können. In der Praxis sollte ein einzelner Cluster in der Regel innerhalb derselben Netzwerkumgebung mit geringer Latenz bereitgestellt werden.

Wichtig ist, dass der Cluster-Modus von NocoBase die horizontale Skalierung und Hochverfügbarkeit von Anwendungsinstanzen auf der Anwendungsebene adressiert. Wenn Sie Warm-Standby oder Disaster Recovery über Verfügbarkeitszonen oder Regionen hinweg benötigen, werden in der Regel mehrere unabhängige Cluster bereitgestellt. Das Betriebsteam ist dann für die Replikations- und Umschaltstrategie von Datenbank, gemeinsamem Speicher und anderer Infrastruktur verantwortlich.

## Systemarchitektur

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Anwendungs-Cluster**: Ein Cluster, der aus mehreren NocoBase-Anwendungsinstanzen besteht. Er kann auf mehreren Servern bereitgestellt oder als mehrere Prozesse im Mehrkern-Modus auf einem einzelnen Server ausgeführt werden.
*   **Datenbank**: Speichert die Daten der Anwendung. Sie kann eine Einzelknoten-Datenbank oder eine verteilte Datenbank sein.
*   **Gemeinsamer Speicher**: Dient zur Speicherung von Anwendungsdateien und -daten und unterstützt den Lese-/Schreibzugriff von mehreren Instanzen.
*   **Middleware**: Umfasst Komponenten wie Cache, Synchronisationssignale, Nachrichtenwarteschlangen und verteilte Sperren, um die Kommunikation und Koordination innerhalb des Anwendungs-Clusters zu unterstützen.
*   **Lastverteiler**: Verantwortlich für die Verteilung von Client-Anfragen an verschiedene Instanzen im Anwendungs-Cluster sowie für die Durchführung von Zustandsprüfungen und Failover.

## Weitere Informationen

Dieses Dokument stellt lediglich die grundlegenden Konzepte und Komponenten des NocoBase Cluster-Modus vor. Für spezifische Bereitstellungsdetails und weitere Konfigurationsoptionen beziehen Sie sich bitte auf die folgenden Dokumente:

- Bereitstellung
  - [Vorbereitungen](./preparations)
  - [Kubernetes-Bereitstellung](./kubernetes)
  - [Betriebsabläufe](./operations)
- Erweitert
  - [Dienstaufteilung](./services-splitting)
- [Entwicklerreferenz](./development)
