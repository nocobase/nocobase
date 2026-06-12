# Über Docker Compose installieren

Wenn Sie NocoBase direkt auf dem Server ausführen möchten, ist `docker compose` immer noch der direkteste Weg. Eine Portion `docker-compose.yml` reicht für die meisten Szenarien aus.

In einer Produktionsumgebung wird jedoch empfohlen, die spezifische Versionsnummer festzulegen und `latest` längere Zeit nicht direkt zu verwenden. Dadurch wird das Upgrade besser kontrollierbar.

## Voraussetzungen

- Docker und Docker Compose installiert
- Stellen Sie sicher, dass der Docker-Dienst gestartet ist
- Ein für die Außenwelt zu öffnender Port wurde vorbereitet, z. B. `13000`

## Schritt 1: Erstellen Sie das Projektverzeichnis

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Schritt 2: `docker-compose.yml` erstellen

Das folgende Beispiel verwendet PostgreSQL, was standardmäßig auch die problemloseste Kombination ist:

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

In:

- `APP_KEY` Denken Sie daran, es in Ihre eigene Zufallszeichenfolge zu ändern
- `13000:80` stellt die Zuordnung des `13000`-Ports des Hosts zum `80`-Port des Containers dar
- Wenn Sie bereits über einen Datenbankdienst verfügen, können Sie den Abschnitt `postgres` löschen und `DB_HOST` in die vorhandene Datenbankadresse ändern

Wenn Sie MySQL oder MariaDB verwenden, denken Sie daran, `DB_DIALECT` in den entsprechenden Typ zu ändern und Folgendes hinzuzufügen:

```bash
DB_UNDERSCORED=true
```

## Schritt 3: Starten Sie die Anwendung

```bash
docker compose up -d
```

Überprüfen Sie das Protokoll:

```bash
docker compose logs -f app
```

## Schritt 4: Greifen Sie auf die Anwendung zu

Nachdem die Anwendung gestartet wurde, öffnen Sie:

```text
http://<服务器IP>:13000
```

Wenn Sie es zum ersten Mal starten, folgen Sie einfach den Anweisungen auf der Seite, um das Administratorkonto zu initialisieren.

## Allgemeine Befehle

Container starten oder aktualisieren:

```bash
docker compose up -d
```

Anwendung stoppen:

```bash
docker compose down
```

Überprüfen Sie das Protokoll:

```bash
docker compose logs -f app
```

## Wo Sie als nächstes suchen müssen

- Wenn Sie die Konfiguration von Schlüsseln, Ports, Datenbanken usw. anpassen möchten, lesen Sie weiter unter [Anwendungsumgebungsvariablen](./env.md)
- Wenn Sie bereit sind, offiziell online zu gehen, lesen Sie weiter [Nginx](../production/reverse-proxy/nginx.md) oder [Caddy](../production/reverse-proxy/caddy.md)
- Wenn Sie Daten später sichern möchten, lesen Sie weiter unter [Sichern und Wiederherstellen](../operations/backup-restore.md)
