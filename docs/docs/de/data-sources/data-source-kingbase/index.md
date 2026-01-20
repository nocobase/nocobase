---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Datenquelle - KingbaseES-Datenbank

## Einführung

KingbaseES kann als Datenquelle verwendet werden, entweder als primäre Datenbank oder als externe Datenbank.

:::warning
Derzeit werden nur im pg-Modus betriebene KingbaseES-Datenbanken unterstützt.
:::

## Installation

### Als primäre Datenbank verwenden

Die Installationsschritte finden Sie in der Installationsdokumentation. Der Hauptunterschied liegt in den Umgebungsvariablen.

#### Umgebungsvariablen

Bearbeiten Sie die .env-Datei, um die folgenden Umgebungsvariablen hinzuzufügen oder zu ändern:

```bash
# Passen Sie die DB-Parameter bei Bedarf an
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker-Installation

```yml
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # Anwendungsschlüssel zum Generieren von Benutzer-Tokens usw.
      # Wenn der APP_KEY geändert wird, werden alte Tokens ungültig.
      # Verwenden Sie eine zufällige Zeichenfolge und halten Sie diese vertraulich.
      - APP_KEY=your-secret-key
      # Datenbanktyp
      - DB_DIALECT=kingbase
      # Datenbank-Host, kann bei Bedarf durch die IP-Adresse eines vorhandenen Datenbankservers ersetzt werden.
      - DB_HOST=kingbase
      # Datenbankname
      - DB_DATABASE=kingbase
      # Datenbankbenutzer
      - DB_USER=nocobase
      # Datenbankpasswort
      - DB_PASSWORD=nocobase
      # Zeitzone
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Kingbase-Dienst nur zu Testzwecken
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Muss auf "no" gesetzt werden
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Nur pg
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Installation mit create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Als externe Datenbank verwenden

Führen Sie den Installations- oder Upgrade-Befehl aus:

```bash
yarn nocobase install
# oder
yarn nocobase upgrade
```

Aktivieren Sie das Plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Benutzerhandbuch

- Primäre Datenbank: Siehe [Hauptdatenquelle](/data-sources/data-source-main/)
- Externe Datenbank: Siehe [Datenquelle / Externe Datenbank](/data-sources/data-source-manager/external-database)