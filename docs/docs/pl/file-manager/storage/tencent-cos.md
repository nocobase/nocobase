:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Tencent Cloud COS

Silnik przechowywania danych oparty na Tencent Cloud COS. Przed użyciem należy przygotować odpowiednie konto i uprawnienia.

## Parametry konfiguracji

![Przykład konfiguracji silnika przechowywania danych Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Wskazówka}
Ta sekcja przedstawia wyłącznie parametry specyficzne dla silnika przechowywania danych Tencent Cloud COS. Ogólne parametry znajdą Państwo w [Ogólnych parametrach silnika](./index.md#ogólne-parametry-silnika).
:::

### Region

Proszę wprowadzić region przechowywania danych COS, na przykład: `ap-chengdu`.

:::info{title=Wskazówka}
Informacje o regionie Państwa zasobnika można sprawdzić w [konsoli Tencent Cloud COS](https://console.cloud.tencent.com/cos). Wystarczy użyć jedynie prefiksu regionu (nie jest wymagana pełna nazwa domeny).
:::

### SecretId

Proszę wprowadzić ID klucza dostępu autoryzacji Tencent Cloud.

### SecretKey

Proszę wprowadzić Secret klucza dostępu autoryzacji Tencent Cloud.

### Zasobnik

Proszę wprowadzić nazwę zasobnika COS, na przykład: `qing-cdn-1234189398`.