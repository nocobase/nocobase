# Speicher-Engine: Lokaler Speicher

Hochgeladene Dateien werden direkt auf der lokalen Festplatte des Servers gespeichert. Dies ist ideal für Szenarien, in denen das System eine geringe Gesamtmenge an hochgeladenen Dateien verwaltet oder für experimentelle Zwecke.


:::warning Hinweis

Verwenden Sie für lokale Dateien möglichst stabile `/files/`-URLs, damit NocoBase den Dateidatensatz und die Leseberechtigung der aktuellen Rolle prüfen kann. Historische `/storage/uploads/`-URLs erzwingen keine Berechtigungen auf Datensatzebene, werden aber bei Docker, dem integrierten Nginx und von der NocoBase CLI erzeugten Nginx-Konfigurationen standardmäßig auf angemeldete Benutzer beschränkt.

Wenn Sie Verträge, Ausweisdokumente, interne Unterlagen oder andere nicht öffentliche Dateien speichern müssen, verwenden Sie [S3 Pro](./s3-pro). Wenn bereits historische Dateien vorhanden sind, lesen Sie [Migration zu S3 Pro](./migrate-to-s3-pro.md).

Wenn ein benutzerdefiniertes Nginx lokale Uploads per `alias` ausliefert, muss dessen `/storage/uploads/`-Location mit `auth_request` den NocoBase-Authentifizierungsendpunkt aufrufen. Andernfalls wird die standardmäßige Anmeldeprüfung umgangen. Setzen Sie außerdem `X-Content-Type-Options: nosniff` und liefern Sie aktive Inhalte wie `html`, `svg`, `xhtml` und `pdf` als Anhänge aus. Ein vollständiges Beispiel und die Konfiguration für Unteranwendungen finden Sie unter [Nginx-Reverse-Proxy](../../nocobase-cli/production/reverse-proxy/nginx.md), die Risiken im [Sicherheitsleitfaden: Dateispeicherung](../../security/guide.md#dateispeicherung).

Wenn eine bestehende Integration auf anonymen Zugriff auf historische URLs angewiesen ist, setzen Sie `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` und starten Sie die Anwendung neu. Dieser Kompatibilitätsschalter betrifft nur `/storage/uploads/` und ändert die Berechtigungen auf Dateidatensatzebene für `/files/` nicht.

:::

## Konfigurationsparameter

![Beispiel für die Konfiguration der Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Hinweis}
Dieser Abschnitt stellt nur die spezifischen Parameter der lokalen Speicher-Engine vor. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index.md#引擎通用参数).
:::

### Pfad

Der Pfad repräsentiert sowohl den relativen Pfad für die Dateispeicherung auf dem Server als auch den URL-Zugriffspfad. Zum Beispiel steht „`user/avatar`“ (ohne führende oder abschließende Schrägstriche „`/`“) für:

1.  Der relative Pfad auf dem Server, unter dem hochgeladene Dateien gespeichert werden: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2.  Das URL-Präfix für den Zugriff auf die Dateien: `http://localhost:13000/storage/uploads/user/avatar`.
