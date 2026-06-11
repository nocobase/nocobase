#Mehrere Umgebungsverwaltung

Wenn Sie mehrere NocoBase-Anwendungen wie `dev`, `test`, `staging`, `prod` usw. verwalten, können Sie diese jeweils als CLI-Umgebung speichern. Die meisten zukünftigen `nb`-Befehle wirken sich standardmäßig auf die aktuelle Umgebung aus. Daher ist es wichtig, zu bestätigen, welche Umgebung Sie verwenden, bevor Sie Befehle wie `nb app`, `nb api` und `nb db` ausführen.

Ab dieser Version teilt die CLI das Konzept in `current env` und `last env` auf. Normalerweise müssen Sie sich nur um `current env` kümmern – das ist die Umgebung, die die aktuelle Shell- oder Agent-Laufzeit verwendet. Die CLI greift nur dann auf den globalen `last env` zurück, wenn der Sitzungsmodus nicht aktiviert ist.

## Schnellindex

| Ich möchte... | Welcher Befehl soll verwendet werden |
| --- | --- |
| Erstellen Sie eine neue lokale Umgebung und schließen Sie die Initialisierung reibungslos ab | [`nb init`](../../api/cli/init.md) |
| Registrieren Sie eine vorhandene Anwendung als CLI env | [`nb env add`](../../api/cli/env/add.md) |
| Sehen Sie, welche Umgebungen lokal gespeichert sind | [`nb env list`](../../api/cli/env/list.md) |
| Überprüfen Sie den Konnektivitäts- und Authentifizierungsstatus aller Envs | [`nb env status --all`](../../api/cli/env/status.md) |
| Ändern Sie die Umgebung, die von nachfolgenden Befehlen verwendet werden soll | [`nb env use`](../../api/cli/env/use.md) |
| Bestätigen Sie, in welche Umgebung der aktuelle Befehl | fällt [`nb env current`](../../api/cli/env/current.md) und [`nb env status`](../../api/cli/env/status.md) |
| Detaillierte Konfigurationen anzeigen, die von einer Umgebung | gespeichert wurden [`nb env info`](../../api/cli/env/info.md) |
| Aktualisieren Sie die gespeicherte Umgebungskonfiguration und lassen Sie die CLI bei Bedarf den aktuellen Status neu synchronisieren | [`nb env update`](../../api/cli/env/update.md) |
| Nach Ablauf des Anmeldestatus erneut authentifizieren oder eine neue Authentifizierungsmethode verwenden | [`nb env auth`](../../api/cli/env/auth.md) |
| Löschen Sie nicht verwendete Umgebungskonfigurationen und bereinigen Sie bei Bedarf lokal gehostete Ressourcen | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip Es wird empfohlen, zuerst den Sitzungsmodus zu aktivieren

Standardmäßig wird empfohlen, zuerst [`nb session setup`](../../api/cli/session/setup.md) auszuführen. Auf diese Weise können unterschiedliche Terminals, unterschiedliche Shells oder unterschiedliche Agentenlaufzeiten jeweils ihre eigenen `current env` verwalten, und sie werden sich bei parallelen Vorgängen nicht so leicht gegenseitig beeinflussen.

Wenn der Sitzungsmodus nicht aktiviert ist, greift `nb env use` auf die Aktualisierung des globalen `last env` zurück. Wenn in diesem Fall ein Terminal die Umgebung abschneidet, kann auch das andere Terminal betroffen sein.

```bash
nb session setup
```

:::

## Erstellen Sie mehrere Umgebungen

Wenn Sie eine lokale Anwendung erstellen oder wiederherstellen möchten, verwenden Sie einfach `nb init`. Die Initialisierung wird abgeschlossen und die Ergebnisse in einer neuen CLI-Umgebung gespeichert.

```bash
nb init --env dev
nb init --env test
```

Wenn die Anwendung bereits vorhanden ist und Sie sie nur mit der CLI verbinden möchten, ist es normalerweise einfacher, `nb env add` zu verwenden:

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

Bei ersterem geht es eher um die „Initialisierung einer Umgebung“, bei letzterem eher um die „Registrierung einer vorhandenen Umgebung“. Wenn Sie nur eine Verbindung zu einer vorhandenen Anwendung herstellen, verwenden Sie standardmäßig einfach `nb env add`.

## Sehen Sie sich die konfigurierte Umgebung an

Verwenden Sie zunächst `nb env list`, um zu sehen, welche Umgebungen lokal gespeichert wurden:

```bash
nb env list
```

Dieser Befehl zeigt nur die Konfiguration selbst an und prüft nicht aktiv den Anwendungsstatus. Wenn Sie sowohl den Konnektivitäts- als auch den Authentifizierungsstatus sehen möchten, verwenden Sie `nb env status --all`:

```bash
nb env status --all
```

Normalerweise werden Statuswerte wie `ok`, `auth failed`, `unreachable` angezeigt.

## Wechseln Sie die aktuelle Umgebung

Verwenden Sie `nb env use`, um die Umgebung zu wechseln:

```bash
nb env use dev
```

Nachdem der Wechsel abgeschlossen ist, verwenden nachfolgende Befehle, die `--env` weglassen, standardmäßig diese Umgebung.

## Überprüfen Sie die aktuelle Umgebung

Wenn Sie nicht sicher sind, in welche Umgebung der aktuelle Befehl fallen wird, führen Sie zuerst diese beiden Befehle aus:

```bash
nb env current
nb env status
```

`nb env current` wird verwendet, um den Namen anzuzeigen, `nb env status` wird verwendet, um festzustellen, ob auf die aktuelle Umgebung zugegriffen werden kann und die Authentifizierung normal ist.

## Details einer einzelnen Umgebung anzeigen

Wenn Sie sehen möchten, welche Konfigurationen in einer bestimmten Umgebung gespeichert sind, verwenden Sie `nb env info`:

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Unter diesen eignet sich `--field` dazu, nur einen Wert im Skript anzunehmen. `--show-secrets` zeigt vertrauliche Informationen wie Token und Passwörter im Klartext an. Verwenden Sie sie nur, wenn Sie eindeutig eine Fehlerbehebung durchführen müssen.

## Umgebungskonfiguration aktualisieren

`nb env update` wird verwendet, um die Konfiguration einer gespeicherten Umgebung anzupassen. Wie API-Adresse, Authentifizierungsmethode, Quellcodequelle, Anwendungsport und Datenbankparameter. Sobald das Update abgeschlossen ist, führt die CLI automatisch Folgeschritte basierend auf den Änderungen durch.

Wenn Sie nur möchten, dass die CLI entsprechend dem neuesten Status der aktuellen Umgebung neu synchronisiert wird, schreiben Sie einfach so:

```bash
nb env update
nb env update prod
```

Wenn Sie die von dieser Umgebung gespeicherten Verbindungsinformationen oder lokalen Konfigurationen ändern möchten, können Sie die Parameter explizit mitbringen:

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Hier können Sie sich zunächst an ein Versäumnisurteil erinnern:

- Um die von env gespeicherten Verbindungsinformationen oder lokalen Konfigurationen zu ändern, verwenden Sie `nb env update`
- Die verfügbaren Funktionen der Anwendungsschnittstelle, des Plug-Ins oder der CLI haben sich gerade geändert. Sie können `nb env update` auch erneut ausführen
- Der Anmeldestatus ist abgelaufen oder Sie müssen den Authentifizierungsprozess erneut durchlaufen. Verwenden Sie `nb env auth`.
- Um zu sehen, was aktuell gespeichert ist, verwenden Sie `nb env info`

Wenn Sie lokal ausgeführte Konfigurationen wie `app-port`, `timezone` und `db-*` ändern, ändert `update` nur den gespeicherten Wert und startet die Anwendung nicht automatisch neu. Im Allgemeinen wird `nb app restart --env <name>` später ausgeführt. Wenn die Änderung die von der CLI verwaltete integrierte Datenbank betrifft, verwenden Sie `nb app restart --env <name> --with-db`.

## Neuauthentifizierung

Wenn env gespeichert wurde, der Anmeldestatus jedoch abgelaufen ist oder Sie die Authentifizierungsmethode ändern möchten, können Sie sich erneut authentifizieren:

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

Wenn der Umgebungsname weggelassen wird, verwendet die CLI die aktuelle Umgebung. Sobald die Authentifizierung abgeschlossen ist, übernimmt die CLI automatisch die nachfolgende Synchronisierung.

## Umgebung entfernen

Diese Szenarien sind die verwirrendsten. Sie können sich zunächst einen Standardvorschlag merken:

- Wenn Sie die Anwendung nur stoppen möchten, verwenden Sie `nb app stop`
– Ich möchte auch die integrierte Datenbanklaufzeit auf dem aktuellen Computer stoppen, verwenden Sie `nb app stop --with-db`
– Wenn Sie sicher sind, dass diese Umgebung nicht mehr benötigt wird, Sie aber zunächst den Speicher und die lokalen App-Dateien behalten möchten, verwenden Sie `nb env remove`
- Bereinigen Sie sogar die lokalen Hosting-Ressourcen und verwenden Sie `nb env remove --purge`

Wenn Sie nur die gespeicherte Umgebungskonfiguration entfernen möchten:

```bash
nb env remove staging
```

Wenn es sich um eine lokale oder von Docker gehostete Umgebung handelt und Sie auch die laufenden Ressourcen und Speicherdaten auf dem lokalen Computer bereinigen möchten, können Sie `--purge` hinzufügen:

```bash
nb env remove test --purge
```

Im nicht interaktiven Modus muss `nb env remove` explizit in `--force` übergeben werden:

```bash
nb env remove test --purge --force
```

`--purge` bereinigt nur CLI-verwaltete Ressourcen auf dem aktuellen Computer. Bei der Remote-API-Umgebung wird der Remote-Dienst selbst nicht gelöscht.

Wenn Sie nur die Anwendung und die über die CLI verwaltete integrierte Datenbank stoppen möchten, schreiben Sie einfach:

```bash
nb app stop --env app1 --with-db
```

Wenn Sie diese Umgebung entfernen möchten, aber dennoch den Speicher und die lokalen App-Dateien behalten möchten:

```bash
nb env remove app1 --force
```

Wenn Sie den nativ gehosteten Inhalt dieser Umgebung wirklich bereinigen möchten, fügen Sie `--purge` hinzu:

```bash
nb env remove app1 --purge --force
```

Bei lokalen npm/Git-Umgebungen, die von CLI-Downloads verwaltet werden, löscht `--purge` auch CLI-gehostete lokale App-Dateien. Bei HTTP- oder SSH-Env wird nur die in der CLI gespeicherte Env-Konfiguration gelöscht, der externe Dienst selbst wird jedoch nicht gelöscht.

## Verwandte Links

- [`nb env` Befehlsreferenz](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` Befehlsreferenz](../../api/cli/session/index.md)
- [nb app design intent](../cli-design/nb-app-design-intent.md)
- [App verwalten](./manage-app.md)
