# Speicher-Engine: Amazon S3

Die Amazon S3 Speicher-Engine erfordert vor der Verwendung die Einrichtung der entsprechenden Konten und Berechtigungen.


:::warning Hinweis

Diese Engine unterstützt keinen privaten Zugriff. Nach dem Hochladen erzeugt NocoBase eine direkt zugängliche URL, und jeder, der diese URL besitzt, kann auf die Datei zugreifen.

Auch wenn der S3-Bucket selbst privat ist, erzeugt die integrierte Amazon S3-Engine keine temporären signierten URLs für den Dateizugriff. Wenn Sie privaten Zugriff benötigen, verwenden Sie [S3 Pro](./s3-pro). Wenn bereits historische Dateien vorhanden sind, lesen Sie [Migration zu S3 Pro](./migrate-to-s3-pro.md).

:::

## Konfigurationsparameter

![Amazon S3 Speicher-Engine Konfigurationsbeispiel](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Hinweis}
Dieser Abschnitt stellt nur die spezifischen Parameter der Amazon S3 Speicher-Engine vor. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index#引擎通用参数).
:::

### Region

Geben Sie die S3-Speicherregion ein, zum Beispiel: `us-west-1`.

:::info{title=Hinweis}
Die Regionsinformationen für Ihren Bucket können Sie in der [Amazon S3 Konsole](https://console.aws.amazon.com/s3/) einsehen. Es genügt, den Regionspräfix zu verwenden (die vollständige Domain ist nicht erforderlich).
:::

### AccessKey ID

Geben Sie die AccessKey ID für den autorisierten Amazon S3 Zugriff ein.

### AccessKey Secret

Geben Sie das AccessKey Secret für den autorisierten Amazon S3 Zugriff ein.

### Bucket

Geben Sie den Namen des S3-Buckets ein.