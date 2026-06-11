# NB App-Designabsicht

`nb app`-bezogene Befehle sind im Wesentlichen Anpassungen, die auf verschiedenen Prozessverwaltungsmethoden basieren und dann in einer Reihe stabiler Anwendungsverwaltungseingänge vereinheitlicht werden. Der Zweck besteht darin, zu versuchen, den mentalen Gebrauch während des täglichen Betriebs und der Wartung mit einer Reihe von Befehlen zusammenzuführen.

Derzeit umfassen die von CLI unterstützten Methoden zur Verwaltung von Bewerbungsprozessen hauptsächlich:

- Docker
-PM2

Wenn wir in Zukunft weitere Methoden wie Supervisor unterstützen müssen, werden wir weiterhin Anpassungen auf dieser Ebene vornehmen. Der nach außen gerichtete Hochfrequenz-Befehlseingang bleibt derselbe:

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## Warum sollten wir es in `nb app` vereinheitlichen?

Prozessmanagement kann auf viele Arten implementiert werden, aber für die meisten Benutzer ist das, was sie wirklich interessiert, nicht die Verwendung auf der untersten Ebene, sondern die spezifischen Aktionen „Ich möchte die Anwendung starten“, „Ich möchte das Protokoll lesen“ und „Ich möchte die Anwendung aktualisieren“.

Wenn die zugrunde liegenden Unterschiede direkt aufgedeckt werden, müssen Benutzer zunächst feststellen, welchen Betriebsmodus sie derzeit verwenden, und sich dann die entsprechenden Betriebsmethoden merken. Nach der Vereinheitlichung in `nb app` können diese hochfrequenten Aktionen zu einer Reihe stabiler Eingänge zusammenlaufen.

### Reduzieren Sie die Lernkosten

Verschiedene Prozessmanagementlösungen funktionieren auf unterschiedliche Weise:

- Docker verfügt über das Befehlssystem von Docker
- PM2 verfügt über ein PM2-Befehlssystem
- Supervisor verfügt auch über eine eigene Konfigurationsmethode

Wenn diese Unterschiede direkt aufgedeckt werden, müssen Benutzer mehrere Verwendungsmethoden erlernen und es wird leichter sein, wichtige Schritte in Hochfrequenzszenarien wie Upgrades, Neustarts und Protokollfehlerbehebung zu übersehen.

Nach der Vereinheitlichung als `nb app` ist für die meisten täglichen Verwaltungsaufgaben nur noch die Beherrschung eines Befehlssatzes erforderlich.

### Geschäftsprozesse vereinheitlichen

Beim Application Lifecycle Management geht es nicht nur um Prozessmanagement.

Bei Prozessen wie Starten, Aktualisieren und Stoppen muss die CLI oft zusätzliche Logik verarbeiten, wie zum Beispiel:

- Umweltinspektion
- Konfigurationsverarbeitung
- Datenmigration
- Versions-Upgrade
- Protokollverwaltung

Durch die Verwendung von `nb app` als einheitlichen Eingang können Sie sicherstellen, dass das Verhalten dieser Prozesse konsistent ist. Wenn Sie Ihre Fähigkeiten in Zukunft weiter ausbauen, müssen Sie keinen neuen Betriebs- und Wartungszugang neu erlernen.

## Warum wird `nb app autostart` noch benötigt?

Nach einem einheitlichen Prozessmanagement-Eingang muss eine weitere Ebene der „Selbststart-Management“-Funktion hinzugefügt werden, um den gesamten Prozess zu vervollständigen. Aus diesem Grund existiert `nb app autostart`.

Allgemeiner Gebrauch ist:

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

Im Mittelpunkt dieser Anordnungen steht die Wahrung der Einheit nach außen. Mit anderen Worten: Aus Sicht des Benutzers ist es auf dieser Ebene von `nb app` egal, ob die unterste Ebene Docker, PM2 oder andere Methoden ist, die möglicherweise in Zukunft unterstützt werden. Die externe einheitliche Betriebsmethode ähnelt immer noch:

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` Woran passt sich diese Ebene an?

`nb app autostart` ist ebenfalls in zwei Verantwortungsebenen unterteilt:

- `enable` / `disable` sind dafür verantwortlich, zu verwalten, ob eine bestimmte Umgebung einen automatischen Start zulässt
- `run` ist dafür verantwortlich, während der Systemstartphase alle Envs hochzurufen, für die der Selbststart aktiviert ist.

Mit anderen Worten: Die CLI stellt auch einen einheitlichen `run`-Eintrag bereit, um Zugriff auf den Selbststartmechanismus des Systems zu ermöglichen:

```bash
nb app autostart run
```

Was hier angepasst wird, sind Systemstartmechanismen wie `systemd`, `launchd` und Host-Startskripte, nicht Anwendungsprozessmanager wie Supervisor.

## Gesamt

- `nb app`-bezogene Befehle sind im Wesentlichen eine Anpassungsschicht über verschiedenen Prozessverwaltungsmethoden. Nachdem sie äußerlich vereinheitlicht wurden, können sie die geistige Verwirrung des Benutzers verringern.
- Die Implementierung des Prozessmanagements kann Docker, PM2, Supervisor usw. sein. Derzeit werden Docker und PM2 unterstützt
- Da die Selbststartkonfigurationen verschiedener Prozessmanagementmethoden unterschiedlich sind, ist ein einheitlicher Satz von `nb app autostart`-Funktionen erforderlich, damit der gesamte Prozess abgeschlossen ist.

Wenn Sie weiterhin den täglichen Betrieb sehen möchten, können Sie direkt zu [Anwendung verwalten] (../operations/manage-app.md) gehen. Wenn Sie bereit sind, die Anwendung in der formalen Umgebung bereitzustellen, können Sie sich weiterhin [Produktionsumgebungsbereitstellung](../produktion/index.md) ansehen.
