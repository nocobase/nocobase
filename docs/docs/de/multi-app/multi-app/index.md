---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-App-Verwaltung

## Überblick

Die Multi-App-Verwaltung ist eine einheitliche Verwaltungslösung von NocoBase. Damit können Sie mehrere **physisch isolierte** NocoBase-App-Instanzen in einer oder mehreren Laufzeitumgebungen erstellen und verwalten. Mit dem **AppSupervisor** lassen sich mehrere Apps über einen zentralen Einstiegspunkt anlegen und pflegen.

## Einzelne App

Zu Beginn eines Projekts starten die meisten Teams mit einer einzelnen App.

In diesem Modus wird nur eine NocoBase-Instanz bereitgestellt. Alle Geschäftslogik, Daten und Benutzer laufen in derselben App. Deployment und Konfiguration sind einfach und kostengünstig.

Mit wachsender Komplexität entstehen jedoch typische Grenzen:

- Funktionen häufen sich und das System wird aufgebläht
- Fachbereiche lassen sich schwer voneinander trennen
- Skalierungs- und Wartungskosten steigen kontinuierlich

Dann ist es sinnvoll, Geschäftsbereiche auf mehrere Apps aufzuteilen.

## Shared-Memory-Multi-App

Wenn Sie Geschäftsbereiche trennen möchten, aber keine komplexe Betriebs- und Deployment-Architektur einführen wollen, ist der Shared-Memory-Multi-App-Modus geeignet.

Dabei laufen mehrere Apps in einer NocoBase-Instanz. Jede App ist unabhängig, kann eine eigene Datenbank verwenden und einzeln erstellt, gestartet oder gestoppt werden. Gleichzeitig teilen sich alle Apps denselben Prozess- und Speicherraum.

![](https://static-docs.nocobase.com/202512231055907.png)

Vorteile dieses Ansatzes:

- Trennung nach App-Ebene
- Klarere Abgrenzung von Funktionen und Konfigurationen
- Geringerer Ressourcenverbrauch als Multi-Prozess- oder Multi-Container-Ansätze

Da alle Apps im selben Prozess laufen, teilen sie CPU und Speicher. Hohe Last oder Fehler einer App können andere Apps beeinträchtigen.

Bei steigender App-Anzahl oder höheren Anforderungen an Isolation und Stabilität sollte die Architektur weiterentwickelt werden.

## Hybrides Multi-Umgebungs-Deployment

Wenn Anzahl und Komplexität der Apps weiter wachsen, stößt das Shared-Memory-Modell auf Grenzen bei Ressourcen, Stabilität und Sicherheit. Dann empfiehlt sich ein **hybrides Multi-Umgebungs-Deployment**.

Kernidee: Eine **Einstiegsanwendung** dient als zentrale Steuerungsebene, während mehrere NocoBase-Instanzen als Laufzeitumgebungen die Business-Apps tatsächlich ausführen.

Verantwortung der Einstiegsanwendung:

- Erstellen, Konfigurieren und Lifecycle-Management von Apps
- Verteilung von Verwaltungsbefehlen und Aggregation von Statusinformationen

Verantwortung der Laufzeitumgebungen:

- Tatsächliches Hosting und Ausführen von Business-Apps im Shared-Memory-Modell

Aus Benutzersicht bleibt die Verwaltung zentral. Intern gilt:

- Unterschiedliche Apps können auf verschiedenen Nodes oder Clustern laufen
- Jede App kann eigene Datenbanken und Middleware nutzen
- Lastintensive Apps können isoliert oder unabhängig skaliert werden

![](https://static-docs.nocobase.com/202512231215186.png)

Dieses Modell ist gut geeignet für SaaS-Plattformen, große Demo-Landschaften und Multi-Tenant-Szenarien.
