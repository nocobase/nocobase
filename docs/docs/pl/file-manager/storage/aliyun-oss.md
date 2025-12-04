:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Silnik przechowywania: Aliyun OSS

Silnik przechowywania oparty na Aliyun OSS. Przed rozpoczęciem korzystania należy przygotować odpowiednie konto oraz uprawnienia.

## Parametry konfiguracji

![Przykład konfiguracji silnika przechowywania Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Wskazówka}
W tej sekcji przedstawiono wyłącznie parametry specyficzne dla silnika przechowywania Aliyun OSS. Ogólne parametry znajdą Państwo w sekcji [Ogólne parametry silnika](./index#引擎通用参数).
:::

### Region

Proszę podać region przechowywania OSS, na przykład: `oss-cn-hangzhou`.

:::info{title=Wskazówka}
Informacje o regionie swojego zasobnika (bucket) mogą Państwo sprawdzić w [konsoli Aliyun OSS](https://oss.console.aliyun.com/). Wystarczy użyć jedynie prefiksu regionu (bez pełnej nazwy domeny).
:::

### AccessKey ID

Proszę podać ID klucza dostępu Aliyun.

### AccessKey Secret

Proszę podać Secret klucza dostępu Aliyun.

### Zasobnik (Bucket)

Proszę podać nazwę zasobnika OSS.

### Limit czasu

Proszę podać limit czasu dla przesyłania danych do Aliyun OSS. Wartość podaje się w milisekundach, a domyślna to `60000` milisekund (czyli 60 sekund).