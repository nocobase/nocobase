---
title: "Tencent Cloud COS"
description: "Настройка движка хранения Tencent Cloud COS: Bucket, Region, SecretId, загрузка файлов в объектное хранилище."
keywords: "Tencent Cloud COS, объектное хранилище Tencent Cloud, хранилище COS, облачное хранилище, NocoBase"
---

# Tencent Cloud COS

Движок хранения на базе Tencent Cloud COS. Перед использованием необходимо подготовить соответствующую учетную запись и права доступа.

## Параметры конфигурации

![Пример конфигурации движка хранения Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Подсказка}
Здесь описаны только специальные параметры движка хранения Tencent Cloud COS. Общие параметры см. в разделе [Общие параметры движка](./index.md#引擎通用参数).
:::

### Регион

Укажите регион хранения COS, например: `ap-chengdu`.

:::info{title=Подсказка}
Информацию о регионе хранилища можно посмотреть в [консоли Tencent Cloud COS](https://console.cloud.tencent.com/cos). При этом достаточно указать только префикс региона (полное доменное имя не требуется).
:::

### SecretId

Укажите идентификатор ключа доступа к Tencent Cloud.

### SecretKey

Укажите секретный ключ доступа к Tencent Cloud.

### Хранилище

Укажите имя хранилища COS, например: `qing-cdn-1234189398`.