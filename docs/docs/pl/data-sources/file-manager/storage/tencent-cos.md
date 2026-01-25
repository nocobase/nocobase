:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Tencent COS

Silnik przechowywania danych oparty na Tencent Cloud COS. Przed użyciem należy przygotować odpowiednie konto i uprawnienia.

## Opcje

![Przykład konfiguracji silnika przechowywania danych Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Wskazówka}
Ta sekcja omawia wyłącznie parametry specyficzne dla silnika przechowywania danych Tencent Cloud COS. Ogólne parametry znajdą Państwo w [Wspólne parametry silnika](./index.md#common-engine-parameters).
:::

### Region

Proszę podać region przechowywania danych COS, na przykład: `ap-chengdu`.

:::info{title=Wskazówka}
Informacje o regionie zasobnika przechowywania danych można znaleźć w [Konsoli Tencent Cloud COS](https://console.cloud.tencent.com/cos). Wystarczy użyć jedynie prefiksu regionu (bez pełnej nazwy domeny).
:::

### SecretId

Proszę podać ID klucza dostępu autoryzacji Tencent Cloud.

### SecretKey

Proszę podać Secret klucza dostępu autoryzacji Tencent Cloud.

### Zasobnik

Proszę podać nazwę zasobnika COS, na przykład: `qing-cdn-1234189398`.