:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Tryb Klastrowy

## Wprowadzenie

NocoBase od wersji v1.6.0 wspiera uruchamianie aplikacji w trybie klastrowym. Uruchomienie aplikacji w tym trybie pozwala na zwiększenie jej wydajności w obsłudze współbieżnego dostępu, dzięki wykorzystaniu wielu instancji oraz trybu wielordzeniowego.

## Architektura Systemu

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Klaster Aplikacji**: Klaster składający się z wielu instancji aplikacji NocoBase. Może być wdrożony na wielu serwerach lub działać jako wiele procesów w trybie wielordzeniowym na pojedynczym serwerze.
*   **Baza Danych**: Przechowuje dane aplikacji. Może to być baza danych jednowęzłowa lub rozproszona.
*   **Pamięć Masowa Współdzielona**: Służy do przechowywania plików i danych aplikacji, umożliwiając dostęp do odczytu i zapisu z wielu instancji.
*   **Middleware**: Obejmuje komponenty takie jak pamięć podręczna (cache), sygnały synchronizacji, kolejki wiadomości i blokady rozproszone, wspierając komunikację i koordynację w klastrze aplikacji.
*   **Load Balancer (równoważenie obciążenia)**: Odpowiada za dystrybucję żądań klientów do różnych instancji w klastrze aplikacji, a także za przeprowadzanie kontroli stanu (health checks) i przełączanie awaryjne (failover).

## Dowiedz się więcej

Ten dokument przedstawia jedynie podstawowe koncepcje i komponenty trybu klastrowego NocoBase. Aby uzyskać szczegółowe informacje dotyczące wdrożenia oraz dodatkowych opcji konfiguracji, prosimy zapoznać się z poniższymi dokumentami:

- Wdrożenie
  - [Przygotowania](./preparations)
  - [Wdrożenie Kubernetes](./kubernetes)
  - [Operacje](./operations)
- Zaawansowane
  - [Podział Usług](./services-splitting)
- [Referencje dla Deweloperów](./development)