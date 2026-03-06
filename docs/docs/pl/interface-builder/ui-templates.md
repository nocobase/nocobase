---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/ui-templates).
:::

# Szablony UI

## Wprowadzenie

Szablony interfejsu użytkownika (UI) służą do ponownego wykorzystywania konfiguracji podczas budowania interfejsu. Pozwalają one ograniczyć powtarzalne czynności oraz zachować synchronizację ustawień w wielu miejscach, gdy jest to wymagane.

Obecnie obsługiwane typy szablonów to:

- **Szablon bloku**: pozwala na ponowne wykorzystanie całej konfiguracji bloku.
- **Szablon pola**: pozwala na ponowne wykorzystanie konfiguracji „obszaru pól” w blokach formularzy lub szczegółów.
- **Szablon okna wyskakującego (pop-up)**: pozwala na ponowne wykorzystanie konfiguracji okien wyzwalanych przez przyciski lub pola.

## Kluczowe pojęcia

### Odniesienie a Duplikowanie

Podczas korzystania z szablonów zazwyczaj dostępne są dwa sposoby:

- **Odniesienie (Reference)**: Wiele miejsc współdzieli tę samą konfigurację szablonu. Modyfikacja szablonu lub dowolnego miejsca, które się do niego odwołuje, spowoduje zsynchronizowanie zmian we wszystkich pozostałych miejscach.
- **Duplikowanie (Duplicate)**: Tworzona jest niezależna kopia konfiguracji. Dalsze modyfikacje nie wpływają na siebie nawzajem.

### Zapisywanie jako szablon

Gdy dany blok lub okno wyskakujące jest już skonfigurowane, mogą Państwo użyć opcji `Zapisz jako szablon` w menu ustawień i wybrać metodę zapisu:

- **Konwertuj bieżący... na szablon**: Po zapisaniu bieżąca lokalizacja zostanie przełączona w tryb odniesienia do tego szablonu.
- **Duplikuj bieżący... jako szablon**: Tworzony jest tylko szablon, a bieżąca lokalizacja pozostaje bez zmian.

## Szablon bloku

### Zapisywanie bloku jako szablonu

1) Proszę otworzyć menu ustawień docelowego bloku i kliknąć `Zapisz jako szablon`.  
2) Proszę podać `Nazwę szablonu` / `Opis szablonu` i wybrać tryb zapisu:
   - **Konwertuj bieżący blok na szablon**: Po zapisaniu bieżący blok zostanie zastąpiony blokiem typu `Szablon bloku` (czyli odniesieniem do tego szablonu).
   - **Duplikuj bieżący blok jako szablon**: Zostanie utworzony tylko szablon, a bieżący blok pozostanie niezmieniony.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Używanie szablonu bloku

1) Dodaj blok → „Inne bloki” → `Szablon bloku`.  
2) W konfiguracji należy wybrać:
   - **Szablon**: Proszę wybrać odpowiedni szablon.
   - **Tryb**: `Odniesienie` lub `Duplikowanie`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Konwersja odniesienia na kopię

Gdy blok korzysta z odniesienia do szablonu, mogą Państwo użyć opcji `Konwertuj odniesienie na kopię` w menu ustawień bloku. Spowoduje to zmianę bieżącego bloku w zwykły blok (rozłączenie odniesienia), a przyszłe modyfikacje nie będą na siebie wpływać.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Uwagi

- Tryb `Duplikowanie` spowoduje ponowne wygenerowanie identyfikatorów UID dla bloku i jego węzłów podrzędnych. Niektóre konfiguracje zależne od UID mogą wymagać ponownego ustawienia.

## Szablon pola

Szablony pól służą do ponownego wykorzystania konfiguracji obszaru pól (wybór pól, układ i ustawienia pól) w **blokach formularzy** oraz **blokach szczegółów**, co pozwala uniknąć powtarzalnego dodawania pól na wielu stronach lub w wielu blokach.

> Szablony pól wpływają tylko na „obszar pól” i nie zastępują całego bloku. Aby powielić cały blok, należy skorzystać z opisanego powyżej szablonu bloku.

### Używanie szablonu pola w blokach formularza/szczegółów

1) Proszę wejść w tryb konfiguracji i otworzyć menu „Pola” w bloku formularza lub szczegółów.  
2) Proszę wybrać `Szablon pola`.  
3) Należy wybrać szablon oraz tryb: `Odniesienie` lub `Duplikowanie`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Komunikat o nadpisaniu

Jeśli w bloku istnieją już pola, użycie trybu **Odniesienie** zazwyczaj wyświetli prośbę o potwierdzenie (ponieważ pola z szablonu zastąpią bieżący obszar pól).

### Konwersja odniesienia pola na kopię

Gdy blok odwołuje się do szablonu pola, mogą Państwo użyć opcji `Konwertuj odniesienie pola na kopię` w menu ustawień bloku, aby uczynić bieżący obszar pól niezależną konfiguracją (rozłączyć odniesienie).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Uwagi

- Szablony pól mają zastosowanie wyłącznie do **bloków formularzy** i **bloków szczegółów**.
- Jeśli szablon i bieżący blok są powiązane z różnymi tabelami danych, szablon zostanie wyświetlony w selektorze jako niedostępny wraz z podaniem przyczyny.
- Jeśli chcą Państwo dokonać „personalizacji” pól w bieżącym bloku, zaleca się bezpośrednie użycie trybu `Duplikowanie` lub wykonanie operacji „Konwertuj odniesienie pola na kopię”.

## Szablon okna wyskakującego

Szablony okien wyskakujących służą do ponownego wykorzystania zestawu interfejsów i logiki interakcji okien pop-up. Informacje o ogólnych konfiguracjach, takich jak sposób otwierania okna czy jego rozmiar, znajdują się w sekcji [Edytuj okno wyskakujące](/interface-builder/actions/action-settings/edit-popup).

### Zapisywanie okna wyskakującego jako szablonu

1) Proszę otworzyć menu ustawień przycisku lub pola, które wyzwala okno, i kliknąć `Zapisz jako szablon`.  
2) Proszę podać nazwę i opis szablonu oraz wybrać tryb zapisu:
   - **Konwertuj bieżące okno na szablon**: Po zapisaniu bieżące okno zostanie przełączone na odniesienie do tego szablonu.
   - **Duplikuj bieżące okno jako szablon**: Zostanie utworzony tylko szablon, a bieżące okno pozostanie bez zmian.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Używanie szablonu w konfiguracji okna wyskakującego

1) Proszę otworzyć konfigurację okna wyskakującego dla przycisku lub pola.  
2) W polu `Szablon okna wyskakującego` należy wybrać odpowiedni szablon.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Warunki użytkowania (Zakres dostępności szablonów)

Szablony okien wyskakujących są powiązane ze scenariuszem akcji, która je wyzwala. Selektor automatycznie odfiltruje lub zablokuje niekompatybilne szablony na podstawie bieżącego kontekstu (z wyświetleniem przyczyny w przypadku niespełnienia warunków).

| Bieżący typ akcji | Dostępne szablony okien wyskakujących |
| --- | --- |
| **Akcja kolekcji** | Szablony utworzone przez akcje tej samej kolekcji |
| **Akcja rekordu bez powiązania** | Szablony utworzone przez akcje kolekcji lub akcje rekordu bez powiązania tej samej kolekcji |
| **Akcja rekordu powiązanego** | Szablony utworzone przez akcje kolekcji lub akcje rekordu bez powiązania tej samej kolekcji; lub szablony utworzone przez akcje rekordu powiązanego dla tego samego pola powiązania |

### Okna wyskakujące danych powiązanych

Okna wyzwalane przez dane powiązane (pola powiązań) mają specjalne zasady dopasowania:

#### Ścisłe dopasowanie dla szablonów okien powiązanych

Gdy szablon okna wyskakującego zostanie utworzony z poziomu **akcji rekordu powiązanego** (szablon posiada właściwość `associationName`), może on być używany wyłącznie przez akcje lub pola dotyczące **dokładnie tego samego pola powiązania**.

Na przykład: szablon utworzony dla pola powiązania `Zamówienie.Klient` może być używany tylko przez inne akcje pola powiązania `Zamówienie.Klient`. Nie może zostać użyty dla pola `Zamówienie.Polecający` (nawet jeśli oba pola wskazują na tę samą tabelę `Klienci`).

Dzieje się tak, ponieważ wewnętrzne zmienne i konfiguracje szablonów okien powiązanych zależą od specyficznego kontekstu relacji.

#### Akcje powiązane wykorzystujące szablony docelowej kolekcji

Pola lub akcje powiązane mogą korzystać z **szablonów okien bez powiązań z docelowej tabeli danych** (szablonów utworzonych przez akcje kolekcji lub akcje rekordu bez powiązania), o ile tabela danych się zgadza.

Na przykład: pole powiązania `Zamówienie.Klient` może używać szablonów okien wyskakujących z tabeli `Klienci`. Jest to przydatne do współdzielenia tej samej konfiguracji okna (np. ujednoliconego widoku szczegółów klienta) w wielu polach powiązań.

### Konwersja odniesienia na kopię

Gdy okno wyskakujące korzysta z odniesienia do szablonu, mogą Państwo użyć opcji `Konwertuj odniesienie na kopię` w menu ustawień, aby uczynić bieżące okno niezależną konfiguracją.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Zarządzanie szablonami

W sekcji Ustawienia systemowe → `Szablony UI` mogą Państwo przeglądać i zarządzać wszystkimi szablonami:

- **Szablony bloków (v2)**: Zarządzanie szablonami bloków.
- **Szablony okien wyskakujących (v2)**: Zarządzanie szablonami okien wyskakujących.

> Szablony pól wywodzą się z szablonów bloków i są zarządzane w ich obrębie.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Obsługiwane operacje: Podgląd, Filtrowanie, Edycja, Usuwanie.

> **Uwaga**: Jeśli szablon jest aktualnie używany jako odniesienie, nie można go bezpośrednio usunąć. Należy najpierw użyć opcji `Konwertuj odniesienie na kopię` w miejscach odwołujących się do tego szablonu, aby rozłączyć powiązania, a dopiero potem usunąć szablon.