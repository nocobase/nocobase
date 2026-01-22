---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Silnik przechowywania: S3 (Pro)

## Wprowadzenie

W oparciu o wtyczkę do zarządzania plikami, dodano obsługę typów przechowywania plików zgodnych z protokołem S3. Każda usługa przechowywania obiektów obsługująca protokół S3, taka jak Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 itp., może być łatwo zintegrowana, co dodatkowo zwiększa kompatybilność i elastyczność usług przechowywania.

## Kluczowe cechy

1. Przesyłanie po stronie klienta: Proces przesyłania plików nie przechodzi przez serwer NocoBase, lecz łączy się bezpośrednio z usługą przechowywania plików, zapewniając bardziej wydajne i szybsze przesyłanie.
    
2. Dostęp prywatny: Podczas uzyskiwania dostępu do plików, wszystkie adresy URL są podpisanymi, tymczasowymi adresami autoryzacyjnymi, co zapewnia bezpieczeństwo i aktualność dostępu do plików.


## Zastosowania

1. **Zarządzanie kolekcjami plików**: Centralne zarządzanie i przechowywanie wszystkich przesłanych plików, z obsługą różnych typów plików i metod przechowywania, co ułatwia ich klasyfikację i wyszukiwanie.
    
2. **Przechowywanie załączników w polach**: Służy do przechowywania danych załączników przesyłanych w formularzach lub rekordach, z obsługą powiązania z konkretnymi rekordami danych.
  

## Konfiguracja wtyczki

1. Proszę włączyć wtyczkę plugin-file-storage-s3-pro.
    
2. Proszę kliknąć "Setting -> FileManager", aby przejść do ustawień zarządzania plikami.

3. Proszę kliknąć przycisk "Add new" i wybrać "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Po wyświetleniu wyskakującego okna zobaczy Pan/Pani formularz z wieloma polami do wypełnienia. Może Pan/Pani zapoznać się z dalszą częścią dokumentacji, aby uzyskać odpowiednie informacje o parametrach dla danej usługi plików i poprawnie je uzupełnić w formularzu.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Konfiguracja dostawcy usług

### Amazon S3

#### Tworzenie Bucketa

1. Proszę otworzyć https://ap-southeast-1.console.aws.amazon.com/s3/home, aby przejść do konsoli S3.
    
2. Proszę kliknąć przycisk "Create bucket" po prawej stronie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Proszę wypełnić pole Bucket Name (nazwa zasobnika). Pozostałe pola można pozostawić z ustawieniami domyślnymi. Proszę przewinąć stronę na dół i kliknąć przycisk **"**Create**"**, aby zakończyć tworzenie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfiguracja CORS

1. Proszę przejść do listy bucketów, znaleźć i kliknąć nowo utworzony Bucket, aby wejść na jego stronę szczegółów.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Proszę kliknąć zakładkę "Permission", a następnie przewinąć w dół, aby znaleźć sekcję konfiguracji CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Proszę wprowadzić poniższą konfigurację (może Pan/Pani ją dalej dostosować) i zapisać.
    
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

#### Uzyskiwanie AccessKey i SecretAccessKey

1. Proszę kliknąć przycisk "Security credentials" w prawym górnym rogu strony.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Proszę przewinąć w dół do sekcji "Access Keys" i kliknąć przycisk "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Proszę kliknąć "Zgadzam się" (jest to demonstracja z kontem głównym; w środowisku produkcyjnym zaleca się użycie IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Proszę zapisać klucz dostępu (Access key) i tajny klucz dostępu (Secret access key) wyświetlone na stronie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Uzyskiwanie i konfiguracja parametrów

1. AccessKey ID i AccessKey Secret to wartości, które uzyskał Pan/Pani w poprzednim kroku. Proszę je dokładnie uzupełnić.
    
2. Proszę przejść do panelu właściwości (properties) strony szczegółów bucketa, gdzie może Pan/Pani uzyskać nazwę Bucketa i informacje o Regionie (obszarze).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Dostęp publiczny (opcjonalnie)

Jest to konfiguracja opcjonalna. Proszę ją ustawić, jeśli chce Pan/Pani, aby przesłane pliki były całkowicie publiczne.

1. Proszę przejść do panelu Permissions, przewinąć w dół do Object Ownership, kliknąć edytuj i włączyć ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Proszę przewinąć do Block public access, kliknąć edytuj i ustawić, aby zezwolić na kontrolę ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Proszę zaznaczyć opcję Public access w NocoBase.


#### Konfiguracja miniatur (opcjonalnie)

Ta konfiguracja jest opcjonalna i służy do optymalizacji rozmiaru lub efektów podglądu obrazów. **Proszę pamiętać, że to rozwiązanie wdrożeniowe może wiązać się z dodatkowymi kosztami. Szczegółowe informacje na temat opłat znajdzie Pan/Pani w odpowiednich warunkach AWS.**

1. Proszę odwiedzić stronę [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Proszę kliknąć przycisk `Launch in the AWS Console` na dole strony, aby rozpocząć wdrażanie rozwiązania.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Proszę postępować zgodnie z instrukcjami, aby zakończyć konfigurację. Należy zwrócić szczególną uwagę na następujące opcje:
   1. Podczas tworzenia stosu (stack) należy podać nazwę zasobnika Amazon S3, który zawiera obrazy źródłowe. Proszę wpisać nazwę zasobnika, który utworzył Pan/Pani wcześniej.
   2. Jeśli zdecyduje się Pan/Pani na wdrożenie interfejsu użytkownika demonstracyjnego, po wdrożeniu będzie można przetestować funkcje przetwarzania obrazów za pomocą tego interfejsu. W konsoli AWS CloudFormation proszę wybrać swój stos, przejść do zakładki „Outputs”, znaleźć wartość odpowiadającą kluczowi DemoUrl i kliknąć ten link, aby otworzyć interfejs demonstracyjny.
   3. To rozwiązanie wykorzystuje bibliotekę `sharp` Node.js do efektywnego przetwarzania obrazów. Może Pan/Pani pobrać kod źródłowy z repozytorium GitHub i dostosować go według potrzeb.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Po zakończeniu konfiguracji proszę poczekać, aż status wdrożenia zmieni się na `CREATE_COMPLETE`.

5. W konfiguracji NocoBase należy zwrócić uwagę na kilka kwestii:
   1. `Thumbnail rule`: Proszę wypełnić parametry związane z przetwarzaniem obrazów, na przykład `?width=100`. Szczegóły znajdzie Pan/Pani w [dokumentacji AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Proszę wypełnić wartość Outputs -> ApiEndpoint po wdrożeniu.
   3. `Full access URL style`: Należy zaznaczyć opcję **Ignore** (ponieważ nazwa zasobnika została już podana podczas konfiguracji i nie jest już potrzebna podczas dostępu).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Tworzenie Bucketa

1. Proszę otworzyć konsolę OSS https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Proszę kliknąć "Buckets" w lewym menu, a następnie przycisk "Create Bucket", aby rozpocząć tworzenie zasobnika.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Proszę wypełnić odpowiednie informacje dotyczące bucketa, a następnie kliknąć przycisk Create.
    
    1. Nazwa Bucketa (Bucket Name) powinna odpowiadać potrzebom Pana/Pani działalności; nazwa może być dowolna.
        
    2. Proszę wybrać Region (obszar) najbliższy Pana/Pani użytkownikom.
        
    3. Pozostałe ustawienia można pozostawić domyślne lub skonfigurować według własnych wymagań.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Konfiguracja CORS

1. Proszę przejść do strony szczegółów bucketa utworzonego w poprzednim kroku.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Proszę kliknąć "Content Security -> CORS" w środkowym menu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Proszę kliknąć przycisk "Create Rule", wypełnić odpowiednie treści, przewinąć w dół i kliknąć "OK". Może Pan/Pani zapoznać się z poniższym zrzutem ekranu lub dokonać bardziej szczegółowych ustawień.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Uzyskiwanie AccessKey i SecretAccessKey

1. Proszę kliknąć "AccessKey" pod zdjęciem profilowym w prawym górnym rogu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. W celu ułatwienia demonstracji, klucz AccessKey jest tworzony za pomocą konta głównego. W środowisku produkcyjnym zaleca się użycie RAM do jego utworzenia. Może Pan/Pani zapoznać się z https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. Proszę kliknąć przycisk "Create AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Proszę przeprowadzić weryfikację konta.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Proszę zapisać klucz dostępu (Access key) i tajny klucz dostępu (Secret access key) wyświetlone na stronie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Uzyskiwanie i konfiguracja parametrów

1. AccessKey ID i AccessKey Secret to wartości uzyskane w poprzednim kroku.
    
2. Proszę przejść do strony szczegółów bucketa, aby uzyskać nazwę Bucketa.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Proszę przewinąć w dół, aby uzyskać Region (końcówka ".aliyuncs.com" nie jest potrzebna).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Proszę uzyskać adres endpointu i dodać prefiks https:// podczas wprowadzania go do NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfiguracja miniatur (opcjonalnie)

Ta konfiguracja jest opcjonalna i powinna być używana tylko wtedy, gdy potrzebuje Pan/Pani zoptymalizować rozmiar lub efekty podglądu obrazów.

1. Proszę wypełnić parametry związane z `Thumbnail rule`. Szczegółowe ustawienia parametrów znajdzie Pan/Pani w [Parametrach przetwarzania obrazów](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. `Full upload URL style` i `Full access URL style` mogą pozostać takie same.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Tworzenie Bucketa

1. Proszę kliknąć menu Buckets po lewej stronie -> kliknąć Create Bucket, aby przejść do strony tworzenia.
2. Po wypełnieniu nazwy Bucketa proszę kliknąć przycisk zapisu.
#### Uzyskiwanie AccessKey i SecretAccessKey

1. Proszę przejść do Access Keys -> kliknąć przycisk Create access key, aby przejść do strony tworzenia.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Proszę kliknąć przycisk zapisu.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Proszę zapisać klucz dostępu (Access Key) i tajny klucz (Secret Key) z wyskakującego okna do późniejszej konfiguracji.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfiguracja parametrów

1. Proszę przejść do strony NocoBase -> File manager.

2. Proszę kliknąć przycisk Add new i wybrać S3 Pro.

3. Proszę wypełnić formularz:
   - **AccessKey ID** i **AccessKey Secret** to wartości zapisane w poprzednim kroku.
   - **Region**: Samodzielnie hostowane MinIO nie ma koncepcji Regionu, dlatego można je skonfigurować jako "auto".
   - **Endpoint**: Proszę wpisać nazwę domeny lub adres IP wdrożonej usługi.
   - Należy ustawić Full access URL style na Path-Style.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Może Pan/Pani odnieść się do konfiguracji wspomnianych powyżej usług plików, ponieważ logika jest podobna.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Może Pan/Pani odnieść się do konfiguracji wspomnianych powyżej usług plików, ponieważ logika jest podobna.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414154500264.png)