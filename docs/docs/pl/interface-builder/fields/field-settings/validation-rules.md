:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Ustawianie reguł walidacji

## Wprowadzenie

Reguły walidacji służą do zapewnienia, że dane wprowadzane przez użytkownika spełniają określone wymagania.

## Gdzie można ustawić reguły walidacji pól

### Konfiguracja reguł walidacji dla pól kolekcji

Większość pól umożliwia konfigurację reguł walidacji. Po ich ustawieniu dla danego pola, walidacja po stronie serwera (backendu) zostanie uruchomiona podczas przesyłania danych. Różne typy pól obsługują różne zestawy reguł walidacji.

- **Pole daty**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Pole liczbowe**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Pole tekstowe**

  Oprócz ograniczenia długości tekstu, pola tekstowe obsługują również niestandardowe wyrażenia regularne, co pozwala na bardziej precyzyjną walidację.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Walidacja po stronie klienta (frontendu) w konfiguracji pola

Reguły walidacji ustawione w konfiguracji pola uruchomią walidację po stronie klienta (frontendu), aby upewnić się, że dane wprowadzane przez użytkownika są zgodne z wymaganiami.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Pola tekstowe** obsługują również niestandardową walidację za pomocą wyrażeń regularnych, aby spełnić specyficzne wymagania dotyczące formatu.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)