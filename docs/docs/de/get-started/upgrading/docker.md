:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Die Aktualisierung einer Docker-Installation

:::warning Vor der Aktualisierung

- Sichern Sie unbedingt zuerst Ihre Datenbank.

:::

## 1. Wechseln Sie in das Verzeichnis der `docker-compose.yml`

Zum Beispiel

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Aktualisieren Sie die Image-Versionsnummer

:::tip Hinweise zu Versionsnummern

- Alias-Versionsnummern wie `latest`, `latest-full`, `beta`, `beta-full`, `alpha` oder `alpha-full` müssen in der Regel nicht geändert werden.
- Numerische Versionsnummern wie `1.7.14` oder `1.7.14-full` müssen auf die Zielversionsnummer geändert werden.
- Versionsnummern unterstützen nur Aktualisierungen, keine Downgrades!!!
- Für Produktionsumgebungen empfehlen wir, eine spezifische numerische Version festzulegen, um unbeabsichtigte automatische Aktualisierungen zu vermeiden. [Alle Versionen ansehen](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Empfehlung: Verwenden Sie das Aliyun-Image (stabileres Netzwerk in China)
    image: nocobase/nocobase:1.7.14-full
    # Sie können auch eine Alias-Version verwenden (kann automatisch aktualisiert werden, mit Vorsicht in der Produktion einsetzen)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (in China möglicherweise langsamer/fehlerhaft)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Starten Sie den Container neu

```bash
# Das neueste Image herunterladen
docker compose pull app

# Den Container neu erstellen
docker compose up -d app

# Den Status des App-Prozesses überprüfen
docker compose logs -f app
```

## 4. Aktualisierung von Drittanbieter-Plugins

Beachten Sie [Plugins installieren und aktualisieren](../install-upgrade-plugins.mdx)

## 5. Hinweise zum Rollback

NocoBase unterstützt keine Downgrades. Wenn Sie ein Rollback durchführen müssen, stellen Sie bitte die Datenbank-Sicherung von vor der Aktualisierung wieder her und setzen Sie die Image-Version auf die ursprüngliche Version zurück.

## 6. Häufig gestellte Fragen (FAQ)

**F: Image-Pull langsam oder fehlgeschlagen**

Verwenden Sie einen Image-Beschleuniger oder das Aliyun-Image `nocobase/nocobase:<tag>`.

**F: Version hat sich nicht geändert**

Bestätigen Sie, dass Sie das `image` auf die neue Versionsnummer geändert und `docker compose pull app` sowie `up -d app` erfolgreich ausgeführt haben.

**F: Download oder Aktualisierung von kommerziellen Plugins fehlgeschlagen**

Für kommerzielle Plugins verifizieren Sie bitte den Lizenzschlüssel im System und starten Sie anschließend den Docker-Container neu. Details finden Sie im [NocoBase Leitfaden zur Aktivierung kommerzieller Lizenzen](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).