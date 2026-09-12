# Plug-in-Installation und Upgrade von Drittanbietern

Wenn Sie ein Plug-in-Paket eines Drittanbieters erhalten, importieren Sie es normalerweise in `storage/plugins` der Zielanwendung, starten Sie die Anwendung neu und aktivieren Sie dann weiter oder überprüfen Sie, ob das Plug-in wirksam wird.

## Schnellindex

| Ich möchte... | Wo suchen |
| --- | --- |
| Wechseln Sie zunächst zur Zielumgebung und beginnen Sie dann mit dem Import oder Neustart des Plug-Ins | [Zuerst die Zielumgebung bestätigen](#Zuerst die Zielumgebung bestätigen) |
| Importieren Sie Plug-Ins von Drittanbietern aus entfernten komprimierten Paketen, lokalen komprimierten Paketen oder npm | [Verwenden Sie `nb plugin import`, um Plug-In-Pakete zu importieren](#Use -nb-plugin-import-Import Plug-In-Pakete) |
| Speicherimport-Plug-in angeben | [Speicherpfad für den Import angeben](#Specify-storage-path to import) |
| Nachdem der Import abgeschlossen ist, lassen Sie die Anwendung das Plug-in-Verzeichnis neu laden | [`nb app restart`](../../api/cli/app/restart.md) |
| Aktivieren Sie das Plug-in nach der ersten Installation offiziell | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Aktualisieren Sie ein aktiviertes Drittanbieter-Plug-in | [Was ist beim Upgrade des Plug-Ins zu tun?](#Was ist beim Upgrade des Plug-Ins zu tun?) |
| Möchten Sie bestätigen, ob das Plug-in in der aktuellen Anwendung angezeigt wurde | [`nb plugin list`](../../api/cli/plugin/list.md) |
| Der Zielcomputer kann nicht direkt mit dem Internet verbunden sein und kann nur manuell hochgeladen `.tgz` und dann importiert werden | [Wenn keine direkte Internetverbindung möglich ist](#Wenn keine direkte Internetverbindung möglich ist) |

## Bestätigen Sie zuerst die Zielumgebung

Wenn Sie mehrere Anwendungen lokal verwalten, wechseln Sie zunächst zur Zielumgebung und führen Sie dann Folgendes aus:

```bash
nb env use app1
```

## Verwenden Sie `nb plugin import`, um das Plug-in-Paket zu importieren

`nb plugin import` unterstützt drei Arten von Quellen: entfernte komprimierte Pakete, lokal komprimierte Pakete und NPM-Paketnamen. Dieser Befehl ist nur für den Import des Plug-Ins in `storage/plugins` verantwortlich und aktiviert das Plug-In nicht automatisch.

Wenn Sie die Download-Adresse des Plug-in-Pakets oder den lokalen Dateipfad erhalten haben oder das Plug-in in npm veröffentlicht wurde, können Sie Folgendes ausführen:

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

Wenn Sie eine private NPM-Quelle verwenden, melden Sie sich normalerweise zuerst an und geben Sie dann die Registrierung an:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Geben Sie den Speicherpfad für den Import an

Wenn Sie das Stammverzeichnis `storage` der Zielanwendung bereits kennen, können Sie `--storage-path` auch direkt übergeben, ohne auf die aktuelle Umgebung angewiesen zu sein:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

Die CLI schreibt das Plugin in `<storage-path>/plugins`. Zu diesem Zeitpunkt dürfen Sie `nb env use` nicht zuerst ausführen oder `--env` übergeben.

## Nach dem Import neu starten

Nachdem der Import abgeschlossen ist, starten Sie die Zielanwendung neu:

```bash
nb app restart
```

Wenn Sie nicht zuerst die aktuelle Umgebung wechseln, können Sie im Befehl auch explizit `-e <env>` übergeben.

## Nach dem Neustart aktivieren oder überprüfen

Wenn es sich um die erste Installation handelt, starten Sie das Plugin neu und aktivieren Sie es:

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

Die Installation wird bei der ersten Aktivierung automatisch abgeschlossen.

## Was ist beim Upgrade von Plugins zu tun?

Wenn das Plug-in bereits aktiviert ist und Sie dieses Mal einfach auf eine neue Version wechseln, sind es in der Regel nur zwei Schritte:

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

Das Gleiche gilt, wenn Sie ein npm-Paket importieren:

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

Mit anderen Worten: Das Upgrade-Szenario erfordert keine zusätzliche Ausführung von `nb plugin enable`. Importieren Sie einfach das neue Paket und starten Sie die Anwendung neu.

## Wenn das Internet nicht direkt verbunden werden kann

Wenn der Zielcomputer nicht direkt auf die Plug-In-Download-Adresse zugreifen kann, können Sie zunächst die Datei `.tgz` in ein beliebiges Verzeichnis auf dem Zielcomputer hochladen und dann einen lokalen Import auf dem Zielcomputer durchführen.

Zum Beispiel:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::Warnhinweis

Es ist hier nicht erforderlich, manuell nach `storage/plugins` zu extrahieren. `nb plugin import` legt das Plug-in automatisch im richtigen Verzeichnis ab.

:::
