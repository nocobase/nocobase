---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Przechowywanie plików: S3 (Pro)

## Wprowadzenie

W oparciu o wtyczkę do zarządzania plikami, ta wersja wprowadza obsługę typów przechowywania plików zgodnych z protokołem S3. Dowolna usługa przechowywania obiektów obsługująca protokół S3, taka jak Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2 itp., może zostać łatwo zintegrowana, co dodatkowo zwiększa kompatybilność i elastyczność usług przechowywania.

## Funkcje

1. **Przesyłanie po stronie klienta:** Pliki są przesyłane bezpośrednio do usługi przechowywania, bez konieczności przechodzenia przez serwer NocoBase. Zapewnia to bardziej efektywne i szybsze przesyłanie.

2. **Prywatny dostęp:** Wszystkie adresy URL plików to podpisane, tymczasowe adresy autoryzacyjne, co gwarantuje bezpieczeństwo i ograniczony czasowo dostęp do plików.

## Scenariusze użycia

1. **Zarządzanie kolekcją plików:** Centralne zarządzanie i przechowywanie wszystkich przesłanych plików, z obsługą różnych typów plików i metod przechowywania, co ułatwia ich klasyfikację i wyszukiwanie.

2. **Przechowywanie załączników w polach:** Służy do przechowywania załączników przesyłanych za pośrednictwem formularzy lub rekordów, z możliwością powiązania ich z konkretnymi wpisami danych.

## Konfiguracja wtyczki

1. Włącz wtyczkę `plugin-file-storage-s3-pro`.

2. Przejdź do "Ustawienia -> FileManager", aby uzyskać dostęp do ustawień zarządzania plikami.

3. Kliknij przycisk "Dodaj nowy" i wybierz "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. W wyskakującym oknie zobaczy Pan/Pani szczegółowy formularz do wypełnienia. Proszę zapoznać się z poniższą dokumentacją, aby uzyskać odpowiednie parametry dla wybranej usługi plików i poprawnie wprowadzić je do formularza.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Konfiguracja dostawcy usług

### Amazon S3

#### Tworzenie Bucketa

1. Proszę odwiedzić [konsolę Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Proszę kliknąć przycisk "Create bucket" po prawej stronie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Proszę wypełnić pole `Bucket Name` (Nazwa Bucketa), pozostawić pozostałe pola jako domyślne, przewinąć na dół strony i kliknąć przycisk **"Create"**, aby zakończyć proces.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Konfiguracja CORS

1. Na liście bucketów proszę znaleźć i kliknąć nowo utworzony bucket, aby przejść do jego szczegółów.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Proszę przejść do zakładki "Permission" (Uprawnienia) i przewinąć w dół do sekcji konfiguracji CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Proszę wprowadzić poniższą konfigurację (można ją dostosować według potrzeb) i zapisać.

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

#### Pobieranie AccessKey i SecretAccessKey

1. Proszę kliknąć przycisk "Security credentials" (Poświadczenia bezpieczeństwa) w prawym górnym rogu strony.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Proszę przewinąć do sekcji "Access Keys" (Klucze dostępu) i kliknąć przycisk "Create Access Key" (Utwórz klucz dostępu).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Proszę zaakceptować warunki (zaleca się użycie IAM w środowiskach produkcyjnych).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Proszę zapisać wyświetlone klucze Access Key i Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Pobieranie i konfiguracja parametrów

1. `AccessKey ID` i `AccessKey Secret` to wartości uzyskane w poprzednim kroku. Proszę je dokładnie wprowadzić.

2. Proszę przejść do panelu właściwości szczegółów bucketa, gdzie znajdzie Pan/Pani nazwę Bucketa i informacje o Regionie.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Dostęp publiczny (opcjonalnie)

Jest to konfiguracja opcjonalna. Proszę ją zastosować, jeśli chce Pan/Pani, aby przesłane pliki były całkowicie publiczne.

1. W panelu "Permissions" (Uprawnienia) proszę przewinąć do "Object Ownership" (Własność obiektów), kliknąć "Edit" (Edytuj) i włączyć ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Proszę przewinąć do "Block public access" (Blokuj dostęp publiczny), kliknąć "Edit" (Edytuj) i ustawić opcję zezwalającą na kontrolę ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Proszę zaznaczyć "Public access" (Dostęp publiczny) w NocoBase.

#### Konfiguracja miniatur (opcjonalnie)

Ta konfiguracja jest opcjonalna i powinna być używana, gdy chce Pan/Pani zoptymalizować rozmiar lub efekt podglądu obrazu. **Proszę pamiętać, że to wdrożenie może wiązać się z dodatkowymi kosztami. Aby uzyskać więcej szczegółów, proszę zapoznać się z warunkami i cennikiem AWS.**

1. Proszę odwiedzić stronę [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Proszę kliknąć przycisk `Launch in the AWS Console` na dole strony, aby rozpocząć wdrożenie.

![](https://static-docs.nocobase.com/20250221164214117.png)

3. Proszę postępować zgodnie z instrukcjami, aby zakończyć konfigurację. Na następujące opcje należy zwrócić szczególną uwagę:
   1. Podczas tworzenia stosu należy określić nazwę bucketa Amazon S3, który zawiera obrazy źródłowe. Proszę wprowadzić nazwę bucketa utworzonego wcześniej.
   2. Jeśli zdecyduje się Pan/Pani na wdrożenie interfejsu użytkownika demonstracyjnego, po wdrożeniu będzie można go użyć do przetestowania funkcji przetwarzania obrazu. W konsoli AWS CloudFormation proszę wybrać swój stos, przejść do zakładki "Outputs" (Wyjścia), znaleźć wartość odpowiadającą kluczowi `DemoUrl` i kliknąć link, aby otworzyć interfejs demonstracyjny.
   3. To rozwiązanie wykorzystuje bibliotekę `sharp` Node.js do efektywnego przetwarzania obrazów. Może Pan/Pani pobrać kod źródłowy z repozytorium GitHub i dostosować go według potrzeb.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4. Po zakończeniu konfiguracji proszę poczekać, aż status wdrożenia zmieni się na `CREATE_COMPLETE`.

5. W konfiguracji NocoBase należy zwrócić uwagę na następujące kwestie:
   1. `Thumbnail rule`: Proszę wypełnić parametry przetwarzania obrazu, np. `?width=100`. Szczegóły znajdzie Pan/Pani w [dokumentacji AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Proszę wprowadzić wartość z Outputs -> ApiEndpoint po wdrożeniu.
   3. `Full access URL style`: Należy wybrać **Ignoruj** (ponieważ nazwa bucketa została już podana w konfiguracji i nie jest potrzebna podczas dostępu).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Tworzenie Bucketa

1. Proszę otworzyć [konsolę OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Proszę wybrać "Buckets" z lewego menu i kliknąć przycisk "Create Bucket" (Utwórz Bucket), aby rozpocząć tworzenie bucketa.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Proszę wypełnić szczegóły bucketa i kliknąć przycisk "Create" (Utwórz).

   - `Bucket Name`: Proszę wybrać nazwę odpowiadającą Pana/Pani potrzebom biznesowym.
   - `Region`: Proszę wybrać region najbliższy Pana/Pani użytkownikom.
   - Pozostałe ustawienia mogą pozostać domyślne lub zostać dostosowane według potrzeb.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Konfiguracja CORS

1. Proszę przejść do strony szczegółów bucketa, który został utworzony w poprzednim kroku.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Proszę kliknąć "Content Security -> CORS" w środkowym menu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Proszę kliknąć przycisk "Create Rule" (Utwórz regułę), wypełnić pola, przewinąć w dół i kliknąć "OK". Może Pan/Pani skorzystać z poniższego zrzutu ekranu lub skonfigurować bardziej szczegółowe ustawienia.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Pobieranie AccessKey i SecretAccessKey

1. Proszę kliknąć "AccessKey" pod awatarem swojego konta w prawym górnym rogu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. W celach demonstracyjnych utworzymy AccessKey za pomocą konta głównego. W środowisku produkcyjnym zaleca się użycie RAM do utworzenia AccessKey. Instrukcje znajdzie Pan/Pani w [dokumentacji Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3. Proszę kliknąć przycisk "Create AccessKey" (Utwórz klucz dostępu).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Proszę przeprowadzić weryfikację konta.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Proszę zapisać wyświetlone klucze Access Key i Secret Access Key.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Pobieranie i konfiguracja parametrów

1. `AccessKey ID` i `AccessKey Secret` to wartości uzyskane w poprzednim kroku.

2. Proszę przejść do strony szczegółów bucketa, aby uzyskać nazwę Bucketa.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Proszę przewinąć w dół, aby uzyskać Region (końcówka ".aliyuncs.com" nie jest potrzebna).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Proszę uzyskać adres endpointu i dodać prefiks `https://` podczas wprowadzania go do NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Konfiguracja miniatur (opcjonalnie)

Ta konfiguracja jest opcjonalna i powinna być używana tylko wtedy, gdy chce Pan/Pani zoptymalizować rozmiar lub efekt podglądu obrazu.

1. Proszę wypełnić odpowiednie parametry dla `Thumbnail rule`. Szczegółowe ustawienia parametrów znajdzie Pan/Pani w [dokumentacji Alibaba Cloud dotyczącej przetwarzania obrazów](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. Ustawienia `Full upload URL style` i `Full access URL style` powinny pozostać takie same.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Tworzenie Bucketa

1. Proszę kliknąć menu **Buckets** po lewej stronie -> kliknąć **Create Bucket** (Utwórz Bucket), aby otworzyć stronę tworzenia.
2. Po wprowadzeniu nazwy Bucketa proszę kliknąć przycisk **Save** (Zapisz).

#### Pobieranie AccessKey i SecretAccessKey

1. Proszę przejść do **Access Keys** (Klucze dostępu) -> kliknąć przycisk **Create access key** (Utwórz klucz dostępu), aby otworzyć stronę tworzenia.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Proszę kliknąć przycisk **Save** (Zapisz).

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Proszę zapisać **Access Key** i **Secret Key** z wyskakującego okna do późniejszej konfiguracji.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Konfiguracja parametrów

1. Proszę przejść do strony **File manager** (Menedżer plików) w NocoBase.

2. Proszę kliknąć przycisk **Add new** (Dodaj nowy) i wybrać **S3 Pro**.

3. Proszę wypełnić formularz:
   - **AccessKey ID** i **AccessKey Secret**: Proszę użyć wartości zapisanych w poprzednim kroku.
   - **Region**: Prywatnie wdrożony MinIO nie posiada koncepcji regionu; może Pan/Pani ustawić go na `"auto"`.
   - **Endpoint**: Proszę wprowadzić nazwę domeny lub adres IP wdrożonej usługi.
   - Należy ustawić **Full access URL style** na **Path-Style**.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Może Pan/Pani odnieść się do konfiguracji dla powyższych usług plików. Logika jest podobna.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Może Pan/Pani odnieść się do konfiguracji dla powyższych usług plików. Logika jest podobna.

#### Przykład konfiguracji

![](https://static-docs.nocobase.com/20250414154500264.png)

## Instrukcja obsługi

Proszę zapoznać się z [dokumentacją wtyczki file-manager](/data-sources/file-manager).