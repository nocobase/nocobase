---
title: "Übersicht über die Bereitstellung der Produktionsumgebung"
description: "Allgemeine Anweisungen für die Bereitstellung in der Produktionsumgebung: Nachdem Sie bestätigt haben, dass die Anwendung normal ausgeführt wird, fügen Sie die Einträge für den automatischen Start der Anwendung und den Reverse-Proxy hinzu."
keywords: "NocoBase, Bereitstellung der Produktionsumgebung, Übersicht, Selbststart der Anwendung, Reverse-Proxy, Nginx, Caddy"
---


# Übersicht über die Bereitstellung der Produktionsumgebung

Wenn Ihre NocoBase bereits normal auf dem Server laufen kann, müssen Sie in der Regel zwei weitere Funktionen hinzufügen, bevor sie offiziell gestartet wird:

1. Ermöglichen Sie, dass die Anwendung nach dem Neustart des Computers automatisch wieder ausgeführt wird.
2. Verbinden Sie den Reverse-Proxy-Eingang mit der Anwendung, um einen stabilen Zugriff auf die Außenwelt zu gewährleisten.

Entsprechend der NocoBase-CLI besteht sie im Wesentlichen aus den folgenden zwei Befehlssätzen:

- `nb app autostart`
- `nb proxy`

Dieser Dokumentensatz gliedert sich im Wesentlichen in zwei Teile:

1. Selbststart der Anwendung: Ermöglichen Sie, dass die Anwendung nach dem Neustart des Computers wieder ausgeführt wird
2. Reverse-Proxy: Stellen Sie einen stabilen externen Zugriffseingang für Anwendungen bereit

Sie können zunächst sehen, welches Stück Sie aktuell mehr benötigen, und dann die entsprechende Seite aufrufen.

## Welche Probleme lösen diese beiden Teile in der Produktionsumgebung?

Das heißt:

- `nb app autostart` löst das Problem „Wie kann der Betrieb von Anwendungen nach dem Systemstart wieder aufgenommen werden“?
- `nb proxy` löst das Problem, „wie man einen stabilen Zugang zur Außenwelt gewährleistet“

:::Tipp Warum verwenden Sie hier nicht direkt Docker, PM2 oder Supervisors eigene selbststartende Konfiguration?

`nb app autostart` umgeht diese Prozessmanagementmethoden nicht, sondern passt unterschiedliche Prozessmanagementmethoden einheitlich an und führt sie dann zu einem stabilen Satz selbststartender Managementeingänge zusammen. Auf diese Weise müssen Sie sich keinen anderen Satz selbststartender Konfigurationen merken, da die zugrunde liegende Schicht Docker, PM2 oder Supervisor ist, die möglicherweise in Zukunft unterstützt wird.

Wenn das System diese Ebene startet, wird sie weiterhin von `systemd`, `launchd` oder dem Host-Startskript verarbeitet. Sie sind dafür verantwortlich, beim Starten der Maschine einmal Folgendes auszuführen:

```bash
nb app autostart run
```

Dieser Befehl ruft dann alle Anwendungen auf, für die der automatische Start aktiviert ist.

Hier sind zwei Ebenen von Dingen, die nicht miteinander vermischt werden sollten:

- Funktionen wie Docker, PM2 und Supervisor entsprechen eher der Art und Weise, wie Anwendungen normalerweise ausgeführt werden und wie Anwendungsprozesse verwaltet werden.
- Funktionen wie `systemd`, `launchd` und Host-Startskripts ähneln eher „Welcher Befehl soll beim Systemstart ausgeführt werden?“

Wenn Sie bei der Frage „Warum brauchen Sie `nb app autostart`“ nicht weiterkommen, lesen Sie einfach weiter [Autostart der Anwendung](./autostart.md) und [nb app design intent](../cli-design/nb-app-design-intent.md).

:::

## Welche Seite soll ich mir jetzt ansehen?

| Ich möchte... | Wo suchen |
| --- | --- |
| Lassen Sie den Server zuerst neu starten, dann kann die Anwendung automatisch wieder ausgeführt werden | [Autostart der Anwendung](./autostart.md) |
| Verstehen Sie zunächst die Eintragsbeziehung von Nginx/Caddy in dieser CLI | [Reverse-Proxy](./reverse-proxy/index.md) |
| Verwenden Sie weiterhin Nginx, um den Site-Eingang zu verwalten | [Nginx](./reverse-proxy/nginx.md) |
| Verbinden Sie HTTPS so schnell wie möglich und pflegen Sie weniger TLS-Details | [Caddy](./reverse-proxy/caddy.md) |
| Sehen Sie sich Start, Stopp, Protokolle und Upgrades der Anwendung selbst an | [Anwendung verwalten](../operations/manage-app.md) |

## Bevor Sie die Produktionsumgebung betreten, bestätigen Sie diese Voraussetzungen

– Die Anwendung wurde als CLI-Umgebung gespeichert
- Die Anwendung kann normal auf dem Server selbst gestartet werden
– Wenn Sie eine Verbindung zum Reverse-Proxy herstellen möchten, wurde `appPort` in env gespeichert
- Wenn Sie bereit sind, es offiziell für die Außenwelt zu öffnen, haben Sie bereits den Domainnamen, den Eingangsport und die HTTPS-Lösung geplant.

Wenn Sie die CLI-Installation oder Env-Initialisierung noch nicht abgeschlossen haben, kehren Sie zu [Installation mit CLI (empfohlen)](../installation/cli.md) zurück.

Wenn der Befehl anzeigt, dass in der Umgebung `appPort` fehlt, führen Sie zunächst [`nb env update`](../../api/cli/env/update.md) aus, um es auszufüllen.

## Verwandte Links

- [Autostart der Anwendung](./autostart.md)
- [Reverse-Proxy](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Anwendung verwalten](../operations/manage-app.md)
