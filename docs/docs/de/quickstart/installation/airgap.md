#Intranet-Installation

Wenn Ihr Server nicht auf das öffentliche Netzwerk zugreifen kann, erfordert die Installationsmethode, dass Sie die für die Offline-Nutzung erforderlichen Images, Abhängigkeiten und Plug-in-Pakete im Voraus vorbereiten. Standardmäßig wird empfohlen, zuerst Docker zu verwenden, da es den kürzesten Pfad hat und am einfachsten zu reproduzieren ist.

## Standardempfehlung: Docker-Image offline vorbereiten

Rufen Sie auf einem Computer, der auf das öffentliche Netzwerk zugreifen kann, zunächst das Anwendungs-Image und das Datenbank-Image herunter:

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Dann als Offline-Datei exportieren:

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Sollten Sie dennoch kommerzielle Plug-Ins benötigen, empfiehlt es sich außerdem, das Plug-In-Paket in der externen Netzwerkumgebung vorzubereiten und es dann gemeinsam ins Intranet zu bringen.

## Kopieren Sie die Datei auf den Intranetserver

Bereiten Sie mindestens diese Dokumente vor:

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` oder Ihre eigenen Bereitstellungsanweisungen

## Importieren Sie das Bild auf den Intranetserver

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Anwendung starten

Nachdem Sie `docker-compose.yml` vorbereitet haben, beginnen Sie direkt:

```bash
docker compose up -d
docker compose logs -f app
```

Wenn Sie noch keine Compose-Datei geschrieben haben, lesen Sie zunächst [Installation über Docker Compose](./docker-compose.md) und speichern Sie die Beispiele dort lokal.

## Was tun, wenn Sie Docker nicht verwenden können?

Wenn Docker in Ihrer Intranetumgebung nicht verwendet werden kann, können Sie auch `create-nocobase-app` verwenden, um ein vollständiges Projekt in der externen Netzwerkumgebung zu erstellen, Abhängigkeiten zu installieren und zu verpacken und dann das gesamte Projekt auf den Intranetserver zu kopieren.

Dieser Weg ist länger, aber in Umgebungen ohne Containerfunktionen praktischer. Der Gesamtprozess ist normalerweise:

1. Erstellen Sie ein Projekt in einer externen Netzwerkumgebung und installieren Sie Abhängigkeiten.
2. Packen Sie das Projektverzeichnis.
3. Auf den Intranetserver kopieren.
4. Entpacken Sie die Datei im Intranet, füllen Sie `.env` aus und starten Sie die Anwendung.

## Wo Sie als nächstes suchen müssen

- Wenn Sie die Anwendungskonfiguration nicht bestätigt haben, lesen Sie weiter unter [Anwendungsumgebungsvariablen](./env.md)
- Wenn Sie bereit sind, die Anwendung offiziell für Geschäftsanwender zu öffnen, lesen Sie weiter [Nginx](../produktion/reverse-proxy/nginx.md) oder [Caddy](../produktion/reverse-proxy/caddy.md)
