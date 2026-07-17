---
title: "Файловое хранилище: S3 (Pro)"
description: "Движок хранилища S3 Pro — корпоративное хранилище, совместимое с протоколом S3, с поддержкой пользовательского Endpoint и расширенной конфигурации."
keywords: "S3 Pro,объектное хранилище,облачное хранилище,совместимость с S3,NocoBase"
---

# Файловое хранилище: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Введение

На основе плагина управления файлами добавляется новый тип файлового хранилища, совместимый с протоколом S3. К нему можно легко подключить любую службу объектного хранения, поддерживающую протокол S3, например Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 и другие, что дополнительно повышает совместимость и гибкость службы хранения.

## Особенности

1. Загрузка с клиента: в процессе загрузки файла не требуется проходить через сервер NocoBase — файл напрямую передаётся в службу хранения, обеспечивая более эффективную и быструю загрузку.

2. Приватный доступ: при обращении к файлам все URL являются временными адресами с подписью и авторизацией, что обеспечивает безопасность и ограниченный срок действия доступа к файлам.


## Сценарии использования

1. **Управление таблицей файлов**: централизованное управление и хранение всех загруженных файлов с поддержкой различных типов файлов и способов хранения, что упрощает их категоризацию и поиск.

2. **Хранение в поле вложений**: используется для хранения вложений, загружаемых в формы или записи, с поддержкой связи с конкретными записями данных.


## Настройка плагина

1. Включите плагин plugin-file-storage-s3-pro

2. Нажмите "Setting-> FileManager", чтобы открыть настройки управления файлами

3. Нажмите кнопку "Add new" и выберите "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. После появления всплывающей панели вы увидите форму с большим количеством полей. Обратитесь к дальнейшей документации, чтобы получить информацию о параметрах соответствующей файловой службы и правильно заполнить форму.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Настройка поставщиков услуг

### Amazon S3

#### Создание Bucket

1. Откройте https://ap-southeast-1.console.aws.amazon.com/s3/home, чтобы перейти в консоль S3

2. Нажмите кнопку "Create bucket" справа

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Укажите Bucket Name (имя хранилища), остальные поля можно оставить со значениями по умолчанию. Прокрутите страницу вниз и нажмите кнопку **"**Create**"**, чтобы завершить создание.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Настройка CORS

1. Перейдите к списку buckets, найдите только что созданный Bucket и нажмите на него, чтобы открыть страницу сведений

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Перейдите на вкладку "Permission", затем прокрутите страницу вниз до раздела настройки CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Введите следующую конфигурацию (при необходимости её можно детализировать) и сохраните

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Получение AccessKey и SecretAccessKey

1. Нажмите кнопку "Security credentials" в правом верхнем углу страницы

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Прокрутите страницу вниз, найдите раздел "Access Keys" и нажмите кнопку "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Нажмите «Согласен» (здесь показан пример с основной учётной записью; в рабочей среде рекомендуется использовать IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Сохраните отображаемые на странице Access key и Secret access key

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Получение и настройка параметров

1. AccessKey ID и AccessKey Secret — это соответствующие значения, полученные на предыдущем шаге. Введите их без ошибок

2. Откройте панель properties на странице сведений о bucket. Там можно получить информацию о названии Bucket и Region (регионе).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Публичный доступ (необязательно)

Эта настройка не является обязательной и выполняется только при необходимости сделать загруженные файлы полностью общедоступными

1. Перейдите на панель Permissions, прокрутите страницу до Object Ownership, нажмите «Редактировать» и включите ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Прокрутите страницу до Block public access, нажмите «Редактировать» и разрешите управление с помощью ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. В NocoBase установите флажок Public access


#### Настройка миниатюр (необязательно)

Эта настройка является необязательной и используется для оптимизации размера или качества предварительного просмотра изображений. **Обратите внимание: этот вариант развертывания может повлечь дополнительные расходы. Точную стоимость см. в соответствующих условиях AWS.**

1. Перейдите в раздел [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Нажмите кнопку `Launch in the AWS Console` в нижней части страницы, чтобы начать развертывание решения.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Завершите настройку согласно инструкциям. Особое внимание обратите на следующие параметры:
   1. При создании стека необходимо указать имя хранилища Amazon S3, содержащего исходные изображения. Укажите имя созданного ранее хранилища.
   2. Если вы выбрали развертывание демонстрационного интерфейса, после завершения развертывания сможете протестировать обработку изображений через этот интерфейс. В консоли AWS CloudFormation выберите свой стек, перейдите на вкладку «Вывод», найдите значение, соответствующее ключу DemoUrl, и нажмите эту ссылку, чтобы открыть демонстрационный интерфейс.
   3. В этом решении для эффективной обработки изображений используется библиотека `sharp` Node.js. Исходный код можно скачать из репозитория GitHub и при необходимости настроить.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. После завершения настройки дождитесь, пока статус развертывания изменится на `CREATE_COMPLETE`.

5. При настройке NocoBase обратите внимание на следующие параметры:
   1. `Thumbnail rule`: укажите параметры обработки изображений, например `?width=100`. Подробнее см. в [документации AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: укажите значение Outputs -> ApiEndpoint после развертывания.
   3. `Full access URL style`: установите флажок **Ignore** (поскольку имя хранилища уже указано при настройке и при обращении к нему больше не требуется).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Пример конфигурации

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Создание Bucket

1. Откройте консоль OSS: https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Откройте пункт "Buckets" в левом меню и нажмите кнопку "Create Bucket", чтобы начать создание хранилища

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Укажите сведения о bucket и нажмите кнопку Create

    1. Bucket Name должен соответствовать вашим задачам; название может быть произвольным

    2. В Region выберите ближайший к пользователю регион

    3. Остальные параметры можно оставить по умолчанию или настроить самостоятельно в соответствии с требованиями

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Настройка CORS

1. Откройте страницу сведений о bucket, созданном на предыдущем шаге

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Нажмите "Content Security -> CORS" в центральном меню

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Нажмите кнопку "Create Rule", заполните необходимые поля, прокрутите страницу вниз и нажмите "OK". Можно воспользоваться примером на снимке экрана ниже или выполнить более детальную настройку

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Получение AccessKey и SecretAccessKey

1. Нажмите "AccessKey" под аватаром в правом верхнем углу

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Для удобства демонстрации AccessKey создаётся для основной учётной записи. В рабочих сценариях рекомендуется использовать RAM; подробности см. в https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Нажмите кнопку "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Пройдите проверку учётной записи

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Сохраните отображаемые на странице Access key и Secret access key

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Получение и настройка параметров

1. AccessKey ID и AccessKey Secret — это значения, полученные на предыдущем шаге

2. Откройте страницу сведений о bucket и получите Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Прокрутите страницу вниз и получите Region (суффикс ".aliyuncs.com" указывать не нужно)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Получите адрес endpoint. При вводе в NocoBase необходимо добавить префикс https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Настройка миниатюр (необязательно)

Эта настройка является необязательной и используется только при необходимости оптимизировать размер или качество предварительного просмотра изображений.

1. Укажите соответствующие параметры `Thumbnail rule`. Подробнее о настройке параметров см. в разделе [Параметры обработки изображений](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` и `Full access URL style` можно оставить одинаковыми.

#### Пример конфигурации

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Создание Bucket

1. Нажмите пункт Buckets в левом меню -> нажмите Create Bucket, чтобы перейти на страницу создания
2. Укажите имя Bucket и нажмите кнопку сохранения
#### Получение AccessKey и SecretAccessKey

1. Перейдите в Access Keys -> нажмите кнопку Create access key, чтобы открыть страницу создания

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Нажмите кнопку сохранения

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Сохраните Access Key и Secret Key из всплывающего окна — они понадобятся для последующей настройки

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Настройка параметров

1. Перейдите в NocoBase -> File manager

2. Нажмите кнопку Add new и выберите S3 Pro

3. Заполните форму
   - **AccessKey ID** и **AccessKey Secret** — это значения, сохранённые на предыдущем шаге
   - **Region**: в частном развертывании MinIO понятие Region отсутствует, поэтому можно указать "auto"
   - **Endpoint**: укажите доменное имя или IP-адрес развернутой службы
   - Для Full access URL style необходимо выбрать Path-Style

#### Пример конфигурации

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Для настройки можно воспользоваться приведёнными выше файловыми службами — логика аналогична

#### Пример конфигурации

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Для настройки можно воспользоваться приведёнными выше файловыми службами — логика аналогична

#### Пример конфигурации

![](https://static-docs.nocobase.com/20250414154500264.png)


## Использование

Используйте плагин file-manager согласно инструкции: https://docs.nocobase.com/data-sources/file-manager/.