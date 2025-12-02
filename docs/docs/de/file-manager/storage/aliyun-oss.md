:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Speicher-Engine: Aliyun OSS

Die Speicher-Engine basiert auf Aliyun OSS. Bevor Sie sie verwenden, müssen Sie die entsprechenden Konten und Berechtigungen vorbereiten.

## Konfigurationsparameter

![Konfigurationsbeispiel für die Aliyun OSS Speicher-Engine](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Hinweis}
Hier werden nur die spezifischen Parameter der Aliyun OSS Speicher-Engine beschrieben. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index#引擎通用参数).
:::

### Region

Geben Sie die Region des OSS-Speichers ein, zum Beispiel: `oss-cn-hangzhou`.

:::info{title=Hinweis}
Die Regionsinformationen Ihres Buckets können Sie in der [Aliyun OSS Konsole](https://oss.console.aliyun.com/) einsehen. Sie benötigen lediglich den Regionspräfix (nicht den vollständigen Domainnamen).
:::

### AccessKey ID

Geben Sie die ID Ihres Aliyun-Zugriffsschlüssels ein.

### AccessKey Secret

Geben Sie das Secret Ihres Aliyun-Zugriffsschlüssels ein.

### Bucket

Geben Sie den Namen des OSS-Buckets ein.

### Timeout

Geben Sie die Timeout-Zeit für den Upload zu Aliyun OSS in Millisekunden ein. Der Standardwert beträgt `60000` Millisekunden (d.h. 60 Sekunden).