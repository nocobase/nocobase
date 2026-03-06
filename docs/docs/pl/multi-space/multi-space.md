---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/multi-space/multi-space).
:::

# Wiele przestrzeni

## Wprowadzenie

**Wtyczka Wiele przestrzeni (Multi-space)** umożliwia tworzenie wielu niezależnych przestrzeni danych w ramach jednej instancji aplikacji poprzez izolację logiczną.

#### Scenariusze zastosowania
- **Wiele sklepów lub fabryk**: Procesy biznesowe i konfiguracje systemu są wysoce spójne – np. ujednolicone zarządzanie zapasami, planowanie produkcji, strategie sprzedaży i szablony raportów – ale dane dla każdej jednostki biznesowej muszą pozostać niezależne i nie zakłócać się nawzajem.
- **Zarządzanie wieloma organizacjami lub spółkami zależnymi**: Wiele organizacji lub spółek zależnych w ramach grupy korzysta z tej samej platformy, ale każda marka posiada niezależne dane dotyczące klientów, produktów i zamówień.

## Instalacja

Znajdź wtyczkę **Wiele przestrzeni (Multi-Space)** w menedżerze wtyczek i włącz ją.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Instrukcja obsługi

### Zarządzanie wieloma przestrzeniami

Po włączeniu wtyczki przejdź do strony ustawień **„Użytkownicy i uprawnienia”** i przełącz się na panel **Przestrzenie**, aby zarządzać przestrzeniami.

> W stanie początkowym istnieje wbudowana **Nieprzypisana przestrzeń (Unassigned Space)**, która służy głównie do przeglądania starych danych niepowiązanych jeszcze z żadną przestrzenią.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Tworzenie przestrzeni

Kliknij przycisk „Dodaj przestrzeń”, aby utworzyć nową przestrzeń:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Przypisywanie użytkowników

Po wybraniu utworzonej przestrzeni możesz po prawej stronie określić użytkowników należących do tej przestrzeni:

> **Wskazówka:** Po przypisaniu użytkowników do przestrzeni należy **ręcznie odświeżyć stronę**, aby lista przełączania przestrzeni w prawym górnym rogu zaktualizowała się i wyświetliła najnowsze przestrzenie.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Przełączanie i przeglądanie przestrzeni

W prawym górnym rogu można przełączać aktualną przestrzeń.  
Kliknięcie **ikony oka** po prawej stronie (stan podświetlony) umożliwia jednoczesne przeglądanie danych z wielu przestrzeni.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Zarządzanie danymi w wielu przestrzeniach

Po włączeniu wtyczki, podczas tworzenia tabeli danych (kolekcji), system automatycznie przygotuje **pole przestrzeni**.  
**Tylko tabele zawierające to pole będą objęte logiką zarządzania przestrzeniami.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

W przypadku istniejących tabel danych można ręcznie dodać pole przestrzeni, aby włączyć zarządzanie przestrzeniami:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Domyślna logika

W tabelach danych zawierających pole przestrzeni system automatycznie stosuje następującą logikę:

1. Podczas tworzenia danych są one automatycznie powiązane z aktualnie wybraną przestrzenią;
2. Podczas filtrowania danych są one automatycznie ograniczane do danych z aktualnie wybranej przestrzeni.

### Klasyfikacja starych danych do przestrzeni

W przypadku danych, które istniały przed włączeniem wtyczki Wiele przestrzeni, można je przypisać do odpowiednich przestrzeni, wykonując poniższe kroki:

#### 1. Dodanie pola przestrzeni

Ręcznie dodaj pole przestrzeni do starej tabeli:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Przypisanie użytkowników do nieprzypisanej przestrzeni

Powiąż użytkowników zarządzających starymi danymi ze wszystkimi przestrzeniami, w tym z **Nieprzypisaną przestrzenią (Unassigned Space)**, aby mogli widzieć dane, które nie zostały jeszcze przypisane:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Przełączenie na widok wszystkich danych

W górnej części ekranu wybierz opcję przeglądania danych ze wszystkich przestrzeni:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfiguracja strony przypisywania starych danych

Utwórz nową stronę do przypisywania starych danych. W **bloku listy** i **formularzu edycji** wyświetl „pole przestrzeni”, aby móc ręcznie dostosować przypisanie do przestrzeni.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Ustaw pole przestrzeni jako edytowalne:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Ręczne przypisywanie przestrzeni danych

Korzystając z powyższej strony, ręcznie edytuj dane, aby stopniowo przypisywać starym danym poprawne przestrzenie (można również skonfigurować edycję zbiorczą).