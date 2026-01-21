:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Silnik przechowywania: Amazon S3

Silnik przechowywania oparty na Amazon S3. Przed użyciem należy przygotować odpowiednie konto i uprawnienia.

## Parametry konfiguracji

![Przykład konfiguracji silnika przechowywania Amazon S3](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Wskazówka}
W tej sekcji przedstawiono jedynie dedykowane parametry dla silnika przechowywania Amazon S3. Parametry ogólne znajdą Państwo w [Parametry ogólne silnika](./index#引擎通用参数).
:::

### Region

Proszę podać region przechowywania S3, na przykład: `us-west-1`.

:::info{title=Wskazówka}
Informacje o regionie dla Państwa zasobnika (bucket) można sprawdzić w [konsoli Amazon S3](https://console.aws.amazon.com/s3/), i wystarczy użyć jedynie prefiksu regionu (bez pełnej nazwy domeny).
:::

### AccessKey ID

Proszę podać ID klucza dostępu (AccessKey ID) Amazon S3.

### AccessKey Secret

Proszę podać Secret klucza dostępu (AccessKey Secret) Amazon S3.

### Nazwa zasobnika

Proszę podać nazwę zasobnika S3.