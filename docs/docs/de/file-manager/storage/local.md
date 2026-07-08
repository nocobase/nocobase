# Speicher-Engine: Lokaler Speicher

Hochgeladene Dateien werden direkt auf der lokalen Festplatte des Servers gespeichert. Dies ist ideal für Szenarien, in denen das System eine geringe Gesamtmenge an hochgeladenen Dateien verwaltet oder für experimentelle Zwecke.


:::warning Hinweis

Lokaler Speicher unterstützt keinen privaten Zugriff. Nach dem Hochladen erzeugt NocoBase eine direkt zugängliche URL, und jeder, der diese URL besitzt, kann auf die Datei zugreifen.

Wenn Sie Verträge, Ausweisdokumente, interne Unterlagen oder andere nicht öffentliche Dateien speichern müssen, verwenden Sie [S3 Pro](./s3-pro). Wenn bereits historische Dateien vorhanden sind, lesen Sie [Migration zu S3 Pro](./migrate-to-s3-pro.md).

Wenn Sie weder Docker noch die offizielle nginx-Konfiguration verwenden und lokale Upload-Dateien über einen benutzerdefinierten Proxy ausliefern, stellen Sie sicher, dass der Pfad `/storage/uploads/` `X-Content-Type-Options: nosniff` setzt und aktive Inhaltsdateien wie `html`, `svg`, `xhtml` und `pdf` als Anhänge zurückgibt. Details finden Sie im [Sicherheitsleitfaden: Dateispeicherung](../../security/guide.md).

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
