---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: "@nocobase/plugin-multi-space"
---

# Wiele przestrzeni

## Wprowadzenie

**Wtyczka Wiele przestrzeni** umożliwia tworzenie wielu niezależnych przestrzeni danych w ramach jednej instancji aplikacji, dzięki logicznej izolacji.

#### Scenariusze użycia
- **Wiele sklepów lub fabryk**: Procesy biznesowe i konfiguracje systemowe są bardzo spójne (np. ujednolicone zarządzanie zapasami, planowanie produkcji, strategie sprzedaży i szablony raportów), ale konieczne jest zapewnienie, że dane każdej jednostki biznesowej nie będą się wzajemnie zakłócać.
- **Zarządzanie wieloma organizacjami lub spółkami zależnymi**: Wiele organizacji lub spółek zależnych w ramach grupy kapitałowej korzysta z tej samej platformy, ale każda marka ma niezależne dane klientów, produktów i zamówień.

## Instalacja

W menedżerze wtyczek proszę znaleźć wtyczkę **Wiele przestrzeni (Multi-Space)** i ją włączyć.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Instrukcja obsługi

### Zarządzanie wieloma przestrzeniami

Po włączeniu wtyczki proszę przejść do strony ustawień **„Użytkownicy i uprawnienia”** i przełączyć się na panel **Przestrzenie**, aby zarządzać przestrzeniami.

> Początkowo istnieje wbudowana **Przestrzeń nieprzypisana (Unassigned Space)**, która służy głównie do przeglądania starych danych, które nie są powiązane z żadną przestrzenią.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Tworzenie przestrzeni

Proszę kliknąć przycisk „Dodaj przestrzeń”, aby utworzyć nową przestrzeń:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Przypisywanie użytkowników

Po wybraniu utworzonej przestrzeni, po prawej stronie mogą Państwo przypisać użytkowników do tej przestrzeni:

> **Wskazówka:** Po przypisaniu użytkowników do przestrzeni należy **ręcznie odświeżyć stronę**, aby lista przełączania przestrzeni w prawym górnym rogu zaktualizowała się i wyświetliła najnowszą przestrzeń.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Przełączanie i przeglądanie wielu przestrzeni

W prawym górnym rogu mogą Państwo przełączyć bieżącą przestrzeń.
Po kliknięciu **ikony oka** po prawej stronie (gdy jest podświetlona), mogą Państwo jednocześnie przeglądać dane z wielu przestrzeni.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Zarządzanie danymi w wielu przestrzeniach

Po włączeniu wtyczki system automatycznie doda **pole przestrzeni** podczas tworzenia tabeli danych (kolekcji).
**Tylko tabele zawierające to pole zostaną włączone do logiki zarządzania przestrzeniami.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

W przypadku istniejących tabel danych, mogą Państwo ręcznie dodać pole przestrzeni, aby włączyć zarządzanie przestrzeniami:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Domyślna logika

W tabelach danych zawierających pole przestrzeni system automatycznie zastosuje następującą logikę:

1. Podczas tworzenia danych są one automatycznie powiązane z aktualnie wybraną przestrzenią;
2. Podczas filtrowania danych są one automatycznie ograniczane do danych z aktualnie wybranej przestrzeni.

### Klasyfikowanie starych danych w wielu przestrzeniach

Dane, które istniały przed włączeniem wtyczki Wiele przestrzeni, mogą Państwo sklasyfikować w przestrzeniach, wykonując następujące kroki:

#### 1. Dodanie pola przestrzeni

Proszę ręcznie dodać pole przestrzeni do starej kolekcji:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Przypisanie użytkowników do przestrzeni nieprzypisanej

Proszę powiązać użytkownika zarządzającego starymi danymi ze wszystkimi przestrzeniami, włączając w to **Przestrzeń nieprzypisaną (Unassigned Space)**, aby móc przeglądać dane, które nie zostały jeszcze przypisane do żadnej przestrzeni:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Przełączenie widoku na dane ze wszystkich przestrzeni

U góry proszę wybrać opcję przeglądania danych ze wszystkich przestrzeni:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfiguracja strony do przypisywania starych danych

Proszę utworzyć nową stronę do przypisywania starych danych. Na **stronie listy** i **stronie edycji** proszę wyświetlić „pole przestrzeni”, aby ręcznie dostosować przypisanie przestrzeni.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Proszę ustawić pole przestrzeni jako edytowalne.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Ręczne przypisywanie danych do przestrzeni

Za pomocą powyższej strony proszę ręcznie edytować dane, aby stopniowo przypisywać stare dane do właściwych przestrzeni (mogą Państwo również samodzielnie skonfigurować edycję masową).