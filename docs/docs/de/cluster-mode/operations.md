:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Wartungsabläufe

## Erster Start der Anwendung

Beim ersten Start der Anwendung sollten Sie zuerst einen Knoten starten. Warten Sie, bis die Plugins installiert und aktiviert sind, bevor Sie die anderen Knoten starten.

## Versions-Upgrade

Wenn Sie die NocoBase-Version aktualisieren müssen, folgen Sie diesem Ablauf.

:::warning{title=Hinweis}
In einer Cluster-**Produktionsumgebung** sollten Funktionen wie Plugin-Verwaltung und Versions-Upgrades mit Vorsicht verwendet oder untersagt werden.

NocoBase unterstützt derzeit keine Online-Upgrades für Cluster-Versionen. Um die Datenkonsistenz zu gewährleisten, müssen externe Dienste während des Upgrade-Prozesses angehalten werden.
:::

Schritte:

1.  Aktuellen Dienst stoppen

    Stoppen Sie alle NocoBase-Anwendungsinstanzen und leiten Sie den Traffic des Load Balancers auf eine 503-Statusseite um.

2.  Daten sichern

    Vor dem Upgrade wird dringend empfohlen, die Datenbankdaten zu sichern, um Probleme während des Upgrade-Prozesses zu vermeiden.

3.  Version aktualisieren

    Beziehen Sie sich auf [Docker-Upgrade](../get-started/upgrading/docker), um die Version des NocoBase-Anwendungsimages zu aktualisieren.

4.  Dienst starten

    1.  Starten Sie einen Knoten im Cluster und warten Sie, bis das Update abgeschlossen und der Knoten erfolgreich gestartet ist.
    2.  Überprüfen Sie die Funktionalität. Sollten Probleme auftreten, die sich nicht beheben lassen, können Sie auf die vorherige Version zurückrollen.
    3.  Starten Sie die anderen Knoten.
    4.  Leiten Sie den Traffic des Load Balancers auf den Anwendungscluster um.

## In-App-Wartung

In-App-Wartung bezieht sich auf die Durchführung wartungsbezogener Vorgänge, während die Anwendung läuft, einschließlich:

*   Plugin-Verwaltung (Plugins installieren, aktivieren, deaktivieren usw.)
*   Sicherung & Wiederherstellung
*   Verwaltung der Umgebungs-Migration

Schritte:

1.  Knoten reduzieren

    Reduzieren Sie die Anzahl der laufenden Anwendungsknoten im Cluster auf einen und stoppen Sie den Dienst auf den anderen Knoten.

2.  Führen Sie In-App-Wartungsvorgänge durch, wie z.B. das Installieren und Aktivieren von Plugins, das Sichern von Daten usw.

3.  Knoten wiederherstellen

    Nach Abschluss der Wartungsvorgänge und erfolgreicher Funktionsprüfung starten Sie die anderen Knoten. Sobald die Knoten erfolgreich gestartet sind, stellen Sie den Betriebsstatus des Clusters wieder her.