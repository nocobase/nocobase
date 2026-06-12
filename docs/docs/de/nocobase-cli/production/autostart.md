---
title: "Die Anwendung startet automatisch"
description: "Verwenden Sie nb app autostart, um einen einheitlichen Anwendungs-Autostart-Eintrag für die CLI-gehostete NocoBase-Umgebung zu konfigurieren."
keywords: "NocoBase, Anwendungs-Autostart, NB-App-Autostart, Systemd, Docker, PM2"
---


# Anwendung startet automatisch

In der NocoBase-CLI wird `nb app autostart` verwendet, um zu verwalten, „welche Envs automatisch gestartet werden dürfen“ und „wie diese Envs nach dem Systemstart einheitlich aufgerufen werden“.

Wenn Sie offiziell eine CLI-gehostete Anwendung auf dem Server ausführen möchten, ist dies normalerweise der Standardschritt in einer Produktionsumgebung.

## Warum wird `nb app autostart` noch benötigt?

Dieses Problem kommt sehr häufig vor.

Wenn viele Leute dies zum ersten Mal sehen, werden sie denken, dass wir eine weitere Schicht von `nb app autostart` benötigen, da die unterste Ebene bereits Docker, PM2 oder das System selbst bereits über `systemd` verfügt.

Der Grund dafür ist, dass diese Schichten nicht tatsächlich das gleiche Problem lösen:

- Funktionen wie Docker, PM2 und Supervisor lösen das Problem, „wie Anwendungen normalerweise ausgeführt werden und wie Anwendungsprozesse verwaltet werden“.
- Funktionen wie `systemd`, `launchd` und Host-Startskripts lösen das Problem „Welcher Befehl soll beim Systemstart ausgeführt werden?“
- `nb app autostart` löst das Problem „auf der NocoBase-CLI-Ebene, wie man einheitlich verwaltet, welche Envs automatisch gestartet werden dürfen, und wie man sie nach dem Systemstart hochzieht“

Mit anderen Worten: CLI macht Docker, PM2 oder Supervisor nicht überflüssig. Stattdessen passt es verschiedene Prozessmanagementmethoden auf einheitliche Weise an und führt sie dann zu einem stabilen Satz selbststartender Managementportale zusammen, um die psychische Erkrankung des Benutzers zu reduzieren.

Wenn das System diese Schicht startet, wird sie weiterhin an `systemd`, `launchd` oder das Host-Startskript übergeben. Sie sind für die Ausführung verantwortlich, wenn die Maschine startet:

```bash
nb app autostart run
```

Dieser Befehl ruft dann alle Anwendungen auf, für die der automatische Start aktiviert ist.

Ohne diese Ebene müssen Sie sich an die jeweiligen selbststartenden Konfigurations- und Wiederherstellungsprozesse von Docker, PM2 oder anderen Methoden erinnern, sobald sich die zugrunde liegende Betriebsmethode unterscheidet. Nach dem Hinzufügen von `nb app autostart` müssen Sie sich nur noch an die gleichen NocoBase-CLI-Nutzungsgewohnheiten erinnern.

Wenn Sie zunächst sehen möchten, warum dieses Design auf diese Weise aufgeschlüsselt ist, lesen Sie weiter [nb app design intent](../cli-design/nb-app-design-intent.md#Why is-nb-app-autostart still needed).

## Welche Aufgaben hat diese Befehlsgruppe?

Die am häufigsten verwendeten sind diese:

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

Wenn man sich nur die häufigsten zwei Verantwortungsebenen anschaut, kann man das so verstehen:

- `enable` / `disable` sind dafür verantwortlich, zu verwalten, ob eine bestimmte Umgebung einen automatischen Start zulässt
- `run` ist dafür verantwortlich, während der Systemstartphase alle Envs hochzurufen, für die der Selbststart aktiviert ist.

Aktivieren Sie zunächst das Autostart-Flag für die aktuelle Umgebung:

```bash
nb app autostart enable
```

Wenn Sie etwas anderes als die aktuelle Umgebung bearbeiten möchten, können Sie dies explizit angeben:

```bash
nb app autostart enable --env app1 --yes
```

Nach der Aktivierung können Sie überprüfen, welche Envs als selbststartend markiert wurden:

```bash
nb app autostart list
```

Nachdem das System gestartet ist, müssen Sie den folgenden Befehl ausführen, um alle Umgebungen aufzurufen, für die der automatische Start aktiviert ist:

```bash
nb app autostart run
```

Wenn Sie bei der Fehlerbehebung die zugrunde liegende Startausgabe sehen möchten, können Sie Folgendes hinzufügen:

```bash
nb app autostart run --verbose
```

Wenn Sie nicht mehr möchten, dass eine Env mit dem System gestartet wird, können Sie diese Markierung auch aufheben:

```bash
nb app autostart disable --env app1 --yes
```

## Welche Beziehung besteht zu Docker, PM2 und systemd?

Hier gibt es eine Grenze, die leicht verwechselt werden kann.

`nb app` Diese Ebene löst das Problem, „wie die Anwendung ausgeführt wird“. Die unterste Ebene kann sich an verschiedene Ausführungsmethoden wie Docker und PM2 anpassen und auch in Zukunft weiter ausgebaut werden.

`nb app autostart` Diese Ebene löst das Problem, „wie man die Umgebung hochzieht, die einen automatischen Start nach dem Starten der Maschine ermöglicht“. Es handelt sich eher um die Bereitstellung eines stabilen Einstiegspunkts für den Host-Startmechanismus als um den Ersatz eines bestimmten Prozessverwaltungstools.

mit anderen Worten:

– Funktionen wie Docker, PM2 und Supervisor sind näher an der Ausführung von Anwendungen
- `systemd`, `launchd`, Host-Startskript, näher an der Systemstartebene

Aus diesem Grund müssen Sie in einer formalen Umgebung normalerweise `nb app autostart run` mit Ihrem eigenen Systemstartprozess verbinden, z. B. `systemd`, `launchd`, Containerplattform-Startskripts oder andere Host-Autostartmechanismen, die Sie bereits verwenden.

## Anwendungsbereich

`nb app autostart` gilt nur für Umgebungen mit einer CLI-verwalteten Laufzeit, das heißt:

- `local`
- `docker`

Wenn es sich bei dieser Umgebung nur um eine Remote-API-Verbindung handelt oder es sich nicht um eine Anwendung handelt, die unter CLI-Verwaltung auf dem aktuellen Computer ausgeführt wird, ist dieser Befehlssatz nicht für den Selbststart geeignet.

##Standardpraxis

In den meisten Szenarien reicht die folgende Reihenfolge aus:

1. Stellen Sie zunächst sicher, dass die Anwendung auf dem aktuellen Computer normal gestartet werden kann
2. `nb app autostart enable --env <name> --yes` ausführen
3. Verbinden Sie `nb app autostart run` mit dem System, um den Vorgang zu starten
4. Starten Sie die Maschine neu oder führen Sie `run` manuell aus, um zu überprüfen, ob sie normal wiederhergestellt wird.

Wenn Sie als nächstes noch die Produktionseintrittsschicht konfigurieren müssen, schauen Sie sich weiterhin [Reverse-Proxy](./reverse-proxy/index.md) an.

## Verwandte Befehle

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Verwandte Links

- [Übersicht über die Bereitstellung der Produktionsumgebung](./index.md)
- [Reverse-Proxy](./reverse-proxy/index.md)
- [nb app design intent](../cli-design/nb-app-design-intent.md)
- [Anwendung verwalten](../operations/manage-app.md)
