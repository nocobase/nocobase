---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Fillagring: S3 (Pro)

## Introduktion

Denna version bygger på pluginen för filhantering och lägger till stöd för fillagringstyper som är kompatibla med S3-protokollet. Alla objektlagringstjänster som stöder S3-protokollet kan enkelt integreras, till exempel Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 med flera, vilket ytterligare förbättrar lagringstjänsternas kompatibilitet och flexibilitet.

## Funktioner

1. **Klientuppladdning:** Filer laddas upp direkt till lagringstjänsten utan att passera NocoBase-servern, vilket möjliggör en effektivare och snabbare uppladdningsupplevelse.
2. **Privat åtkomst:** Alla fil-URL:er är signerade tillfälliga auktoriseringsadresser, vilket säkerställer säker och tidsbegränsad åtkomst till filer.

## Användningsområden

1. **Filhantering i tabeller:** Centralt hantera och lagra alla uppladdade filer, med stöd för olika filtyper och lagringsmetoder för enkel klassificering och hämtning.
2. **Lagring av bilagefält:** Lagra bilagor som laddats upp via formulär eller poster och koppla dem till specifika dataposter.

## Plugin-konfiguration

1. Aktivera pluginen `plugin-file-storage-s3-pro`.
2. Navigera till "Setting -> FileManager" för att komma åt inställningarna för filhantering.
3. Klicka på knappen "Add new" (Lägg till ny) och välj "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. I popup-fönstret ser ni ett detaljerat formulär att fylla i. Se följande dokumentation för att få relevanta parametrar för er filtjänst och fyll i dem korrekt i formuläret.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfiguration av tjänsteleverantör

### Amazon S3

#### Skapa en bucket

1. Besök [Amazon S3 Console](https://ap-southeast-1.console.aws.amazon.com/s3/home).
2. Klicka på knappen "Create bucket" (Skapa bucket) på höger sida.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Fyll i `Bucket Name` (Bucket-namn), lämna övriga fält som standard, scrolla ner till botten och klicka på knappen **"Create"** (Skapa) för att slutföra processen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS-konfiguration

1. I bucket-listan, hitta och klicka på den nyligen skapade bucketen för att komma åt dess detaljer.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Navigera till fliken "Permission" (Behörighet) och scrolla ner till avsnittet för CORS-konfiguration.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Ange följande konfiguration (anpassa vid behov) och spara.

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

#### Hämta AccessKey och SecretAccessKey

1. Klicka på knappen "Security credentials" (Säkerhetsuppgifter) i det övre högra hörnet.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scrolla till avsnittet "Access Keys" (Åtkomstnycklar) och klicka på "Create Access Key" (Skapa åtkomstnyckel).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Godkänn villkoren (användning av IAM rekommenderas för produktionsmiljöer).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Spara den visade Access Key och Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Hämta och konfigurera parametrar

1. Använd de hämtade `AccessKey ID` och `AccessKey Secret`.
2. Besök bucketens egenskapsfönster för att hitta `Bucket Name` och `Region` (region).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Offentlig åtkomst (valfritt)

Detta är en valfri konfiguration. Konfigurera den när ni behöver göra uppladdade filer helt offentliga.

1. I behörighetspanelen, scrolla till "Object Ownership" (Objektägarskap), klicka på "Edit" (Redigera) och aktivera ACL:er.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scrolla till "Block public access" (Blockera offentlig åtkomst), klicka på "Edit" (Redigera) och ställ in den att tillåta ACL-kontroll.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Markera "Public access" (Offentlig åtkomst) i NocoBase.

#### Konfiguration av miniatyrbilder (valfritt)

Denna konfiguration är valfri och bör användas när ni behöver optimera bildförhandsgranskningens storlek eller effekt. **Observera att denna distribution kan medföra extra kostnader. För mer information, se AWS:s villkor och prissättning.**

1. Besök [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Klicka på knappen `Launch in the AWS Console` längst ner på sidan för att starta distributionen.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Följ anvisningarna för att slutföra konfigurationen. Följande alternativ kräver särskild uppmärksamhet:
   1. När ni skapar stacken måste ni ange namnet på Amazon S3-bucketen som innehåller källbilderna. Ange det bucket-namn ni skapade tidigare.
   2. Om ni valde att distribuera demo-gränssnittet kan ni efter distributionen använda gränssnittet för att testa bildbehandlingsfunktionen. I AWS CloudFormation-konsolen, välj er stack, gå till fliken "Outputs" (Utdata), hitta värdet som motsvarar nyckeln `DemoUrl` och klicka på länken för att öppna demo-gränssnittet.
   3. Denna lösning använder Node.js-biblioteket `sharp` för effektiv bildbehandling. Ni kan ladda ner källkoden från GitHub-arkivet och anpassa den vid behov.
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. När konfigurationen är klar, vänta tills distributionens status ändras till `CREATE_COMPLETE`.

5. I NocoBase-konfigurationen, observera följande:
   1. `Thumbnail rule`: Fyll i bildbehandlingsparametrar, till exempel `?width=100`. För detaljer, se [AWS-dokumentationen](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Ange värdet från Outputs -> ApiEndpoint efter distributionen.
   3. `Full access URL style`: Välj **Ignore** (eftersom bucket-namnet redan har fyllts i konfigurationen behövs det inte för åtkomst).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Skapa en bucket

1. Öppna [OSS-konsolen](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Välj "Buckets" från vänstermenyn och klicka på "Create Bucket" (Skapa bucket).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Fyll i bucket-detaljerna och klicka på "Create" (Skapa).

   - `Bucket Name`: Välj baserat på era affärsbehov.
   - `Region`: Välj den närmaste regionen för era användare.
   - Övriga inställningar kan förbli standard eller anpassas vid behov.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS-konfiguration

1. Navigera till detaljsidan för den bucket ni just skapade.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Klicka på "Content Security -> CORS" i mittenmenyn.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Klicka på "Create Rule" (Skapa regel), fyll i fälten, scrolla ner och klicka på "OK". Ni kan referera till skärmbilden nedan eller konfigurera mer detaljerade inställningar.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Hämta AccessKey och SecretAccessKey

1. Klicka på "AccessKey" under er kontoavatar i det övre högra hörnet.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. För demonstrationssyften kommer vi att skapa en AccessKey med huvudkontot. I en produktionsmiljö rekommenderas det att använda RAM för att skapa AccessKey. För instruktioner, se [Alibaba Cloud-dokumentationen](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3. Klicka på knappen "Create AccessKey" (Skapa AccessKey).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Slutför kontoverifieringen.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Spara den visade Access Key och Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Hämta och konfigurera parametrar

1. Använd `AccessKey ID` och `AccessKey Secret` som erhölls i föregående steg.
2. Gå till bucketens detaljsida för att få bucket-namnet.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scrolla ner för att få `Region` (suffixet ".aliyuncs.com" behövs inte).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Hämta endpoint-adressen och lägg till prefixet `https://` när ni anger den i NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfiguration av miniatyrbilder (valfritt)

Denna konfiguration är valfri och bör endast användas när ni optimerar bildförhandsgranskningens storlek eller effekt.

1. Fyll i relevanta parametrar för `Thumbnail rule`. För specifika parameterinställningar, se Alibaba Cloud-dokumentationen om [Bildbehandling](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing).

2. Behåll inställningarna för `Full upload URL style` och `Full access URL style` desamma.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Skapa en bucket

1. Klicka på menyn **Buckets** till vänster -> Klicka på **Create Bucket** (Skapa bucket) för att öppna skapandesidan.
2. Ange bucket-namnet och klicka sedan på knappen **Save** (Spara).

#### Hämta AccessKey och SecretAccessKey

1. Navigera till **Access Keys** (Åtkomstnycklar) -> Klicka på knappen **Create access key** (Skapa åtkomstnyckel) för att öppna skapandesidan.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Klicka på knappen **Save** (Spara).

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Spara **Access Key** och **Secret Key** från popup-fönstret för framtida konfiguration.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Parameterkonfiguration

1. Gå till sidan **File manager** (Filhanterare) i NocoBase.
2. Klicka på knappen **Add new** (Lägg till ny) och välj **S3 Pro**.
3. Fyll i formuläret:
   - **AccessKey ID** och **AccessKey Secret**: Använd de värden som sparades från föregående steg.
   - **Region**: Privat distribuerad MinIO har inget regionkoncept; ni kan ställa in det till `"auto"`.
   - **Endpoint**: Ange domännamnet eller IP-adressen för er distribuerade tjänst.
   - Ställ in **Full access URL style** till **Path-Style**.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Se konfigurationerna för filtjänsterna ovan. Logiken är liknande.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Se konfigurationerna för filtjänsterna ovan. Logiken är liknande.

#### Konfigurationsexempel

![](https://static-docs.nocobase.com/20250414154500264.png)

## Användarhandbok

Se [dokumentationen för filhanterings-pluginen](/data-sources/file-manager).