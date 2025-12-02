:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Aliyun OSS

Die Speicher-Engine basiert auf Aliyun OSS. Bevor Sie sie verwenden, müssen Sie die entsprechenden Konten und Berechtigungen vorbereiten.

## Konfiguration

![Beispiel einer Aliyun OSS Konfiguration](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Hinweis}
Hier werden nur die spezifischen Parameter für die Aliyun OSS Speicher-Engine vorgestellt. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index.md#common-engine-parameters).
:::

### Region

Geben Sie die Region des OSS-Speichers an, zum Beispiel: `oss-cn-hangzhou`.

:::info{title=Hinweis}
Die Regionsinformationen des Speicher-Buckets können Sie in der [Aliyun OSS Konsole](https://oss.console.aliyun.com/) einsehen. Sie müssen nur den Präfix-Teil der Region verwenden (ohne den vollständigen Domainnamen).
:::

### AccessKey ID

Geben Sie die ID des autorisierten Alibaba Cloud Zugriffs-Keys ein.

### AccessKey Secret

Geben Sie das Secret des autorisierten Alibaba Cloud Zugriffs-Keys ein.

### Bucket

Geben Sie den Namen des OSS-Buckets ein.