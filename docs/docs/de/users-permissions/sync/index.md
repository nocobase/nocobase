---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Benutzerdatensynchronisation

## Einführung

Mit dieser Funktion können Sie Quellen für die Benutzerdatensynchronisation registrieren und verwalten. Standardmäßig ist eine HTTP API verfügbar, aber Sie können weitere Datenquellen über Plugins hinzufügen. Die Synchronisation von Daten in die **Benutzer**- und **Abteilungs**-Sammlungen wird standardmäßig unterstützt. Über Plugins lässt sich die Synchronisation auch auf andere Zielressourcen erweitern.

## Datenquellenverwaltung und Datensynchronisation

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Wenn keine Plugins installiert sind, die Quellen für die Benutzerdatensynchronisation bereitstellen, können Benutzerdaten über die HTTP API synchronisiert werden. Siehe [Datenquelle - HTTP API](./sources/api.md).
:::

## Datenquelle hinzufügen

Nachdem Sie ein Plugin installiert haben, das eine Quelle für die Benutzerdatensynchronisation bereitstellt, können Sie die entsprechende Datenquelle hinzufügen. Nur aktivierte Datenquellen zeigen die Schaltflächen „Synchronisieren“ und „Aufgabe“ an.

> Beispiel: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Daten synchronisieren

Klicken Sie auf die Schaltfläche „Synchronisieren“, um die Datensynchronisation zu starten.

![](https://static-docs.nocobase.com/202412041055022.png)

Klicken Sie auf die Schaltfläche „Aufgabe“, um den Synchronisationsstatus anzuzeigen. Nach erfolgreicher Synchronisation können Sie die Daten in den Benutzer- und Abteilungslisten einsehen.

![](https://static-docs.nocobase.com/202412041202337.png)

Bei fehlgeschlagenen Synchronisationsaufgaben können Sie auf „Wiederholen“ klicken.

![](https://static-docs.nocobase.com/202412041058337.png)

Im Falle von Synchronisationsfehlern können Sie die Ursache über die Systemprotokolle ermitteln. Zusätzlich werden die ursprünglichen Datensynchronisationsaufzeichnungen im Verzeichnis `user-data-sync` unter dem Anwendungslog-Ordner gespeichert.

![](https://static-docs.nocobase.com/202412041205655.png)