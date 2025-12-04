:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Aliyun OSS

Silnik przechowywania danych oparty na Aliyun OSS. Przed użyciem należy przygotować odpowiednie konta i uprawnienia.

## Konfiguracja

![Przykład konfiguracji Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Wskazówka}
Tutaj przedstawiono wyłącznie parametry specyficzne dla silnika przechowywania Aliyun OSS. Parametry ogólne znajdą Państwo w sekcji [Wspólne parametry silnika](./index.md#common-engine-parameters).
:::

### Region

Proszę podać region przechowywania OSS, na przykład: `oss-cn-hangzhou`.

:::info{title=Wskazówka}
Informacje o regionie przestrzeni dyskowej (bucket) mogą Państwo sprawdzić w [konsoli Aliyun OSS](https://oss.console.aliyun.com/). Wystarczy użyć jedynie prefiksu regionu (bez pełnej nazwy domeny).
:::

### AccessKey ID

Proszę podać ID klucza dostępu autoryzowanego przez Alibaba Cloud.

### AccessKey Secret

Proszę podać Secret klucza dostępu autoryzowanego przez Alibaba Cloud.

### Bucket

Proszę podać nazwę bucketu przechowywania OSS.