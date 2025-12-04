:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Uprawnienia do operacji

## Wprowadzenie

W NocoBase 2.0 uprawnienia do operacji są obecnie głównie kontrolowane przez uprawnienia zasobów kolekcji:

- **Uprawnienia zasobów kolekcji**: Służą do jednolitego kontrolowania podstawowych uprawnień do operacji (takich jak tworzenie, przeglądanie, aktualizowanie i usuwanie) dla różnych ról w odniesieniu do kolekcji. Uprawnienia te dotyczą całej kolekcji w ramach źródła danych, gwarantując, że uprawnienia do odpowiednich operacji dla danej kolekcji pozostają spójne dla danej roli na różnych stronach, w wyskakujących okienkach i blokach.
<!-- - **Niezależne uprawnienia do operacji**: Służą do precyzyjnej kontroli widoczności operacji dla różnych ról, odpowiednie do zarządzania uprawnieniami dla konkretnych operacji, takich jak wyzwalanie przepływu pracy, niestandardowe żądania, linki zewnętrzne itp. Ten typ uprawnień jest odpowiedni do kontroli uprawnień na poziomie operacji, umożliwiając różnym rolom wykonywanie określonych operacji bez wpływu na konfigurację uprawnień całej kolekcji. -->

### Uprawnienia zasobów kolekcji

W systemie uprawnień NocoBase uprawnienia do operacji na kolekcjach są zasadniczo podzielone według wymiarów CRUD, aby zapewnić spójność i standaryzację w zarządzaniu uprawnieniami. Na przykład:

- **Uprawnienia do tworzenia (Create)**: Kontrolują wszystkie operacje związane z tworzeniem dla danej kolekcji, włączając w to dodawanie i duplikowanie rekordów. Dopóki rola posiada uprawnienia do tworzenia dla tej kolekcji, operacje dodawania, duplikowania i inne związane z tworzeniem będą widoczne na wszystkich stronach i we wszystkich wyskakujących okienkach.
- **Uprawnienia do usuwania (Delete)**: Kontrolują operację usuwania dla tej kolekcji. Uprawnienie pozostaje spójne, niezależnie od tego, czy jest to operacja masowego usuwania w bloku tabeli, czy usuwanie pojedynczego rekordu w bloku szczegółów.
- **Uprawnienia do aktualizacji (Update)**: Kontrolują operacje typu aktualizacji dla tej kolekcji, takie jak edycja i aktualizacja rekordów.
- **Uprawnienia do przeglądania (View)**: Kontrolują widoczność danych tej kolekcji. Powiązane bloki danych (tabela, lista, szczegóły itp.) są widoczne tylko wtedy, gdy rola posiada uprawnienia do przeglądania tej kolekcji.

Ta uniwersalna metoda zarządzania uprawnieniami jest odpowiednia do standaryzowanej kontroli uprawnień do danych, zapewniając, że dla `tej samej kolekcji`, `ta sama operacja` ma `spójne` reguły uprawnień na `różnych stronach, w wyskakujących okienkach i blokach`, co zapewnia jednolitość i łatwość utrzymania.

#### Globalne uprawnienia

Globalne uprawnienia do operacji mają zastosowanie do wszystkich kolekcji w ramach źródła danych i są podzielone według typu zasobu w następujący sposób:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Specyficzne uprawnienia do operacji na kolekcjach

Specyficzne uprawnienia do operacji na kolekcjach mają wyższy priorytet niż ogólne uprawnienia źródła danych, dodatkowo precyzując uprawnienia do operacji i umożliwiając niestandardową konfigurację uprawnień dostępu do zasobów konkretnej kolekcji. Uprawnienia te dzielą się na dwa aspekty:

1.  **Uprawnienia do operacji**: Uprawnienia do operacji obejmują dodawanie, przeglądanie, edytowanie, usuwanie, eksportowanie i importowanie. Uprawnienia te są konfigurowane w oparciu o wymiar zakresu danych:
    -   **Wszystkie rekordy**: Umożliwia użytkownikom wykonywanie operacji na wszystkich rekordach w kolekcji.
    -   **Własne rekordy**: Ogranicza użytkowników do wykonywania operacji tylko na rekordach danych, które sami utworzyli.

2.  **Uprawnienia pól**: Uprawnienia pól pozwalają na konfigurację uprawnień dla każdego pola w różnych operacjach. Na przykład, niektóre pola mogą być skonfigurowane jako tylko do odczytu i nieedytowalne.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Niezależne uprawnienia do operacji

> **Uwaga**: Ta funkcja jest obsługiwana **od wersji v1.6.0-beta.13**

W przeciwieństwie do ujednoliconych uprawnień do operacji, niezależne uprawnienia do operacji kontrolują tylko samą operację, umożliwiając tej samej operacji posiadanie różnych konfiguracji uprawnień w różnych miejscach.

Ta metoda uprawnień jest odpowiednia dla spersonalizowanych operacji, na przykład:

Operacje wyzwalania przepływu pracy mogą wymagać wywołania różnych przepływów pracy na różnych stronach lub w blokach, dlatego wymagają niezależnej kontroli uprawnień.
Niestandardowe operacje w różnych miejscach wykonują specyficzną logikę biznesową i nadają się do oddzielnego zarządzania uprawnieniami.

Obecnie niezależne uprawnienia można skonfigurować dla następujących operacji:

-   Wyskakujące okienko (kontroluje widoczność i uprawnienia operacji wyskakującego okienka)
-   Link (ogranicza, czy rola może uzyskać dostęp do linków zewnętrznych lub wewnętrznych)
-   Wyzwalanie przepływu pracy (do wywoływania różnych przepływów pracy na różnych stronach)
-   Operacje w panelu akcji (np. skanowanie kodu, operacja wyskakującego okienka, wyzwalanie przepływu pracy, link zewnętrzny)
-   Niestandardowe żądanie (wysyła żądanie do strony trzeciej)

Dzięki konfiguracji niezależnych uprawnień do operacji można bardziej szczegółowo zarządzać uprawnieniami do operacji dla różnych ról, co czyni kontrolę uprawnień bardziej elastyczną.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Jeśli rola nie jest ustawiona, domyślnie jest widoczna dla wszystkich ról.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Powiązane dokumenty

[Konfiguracja uprawnień]
<!-- (/users-and-permissions) -->