:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Reguły powiązań bloków

## Wprowadzenie

Reguły powiązań bloków pozwalają użytkownikom dynamicznie kontrolować wyświetlanie bloków, zarządzając prezentacją elementów na poziomie bloku. Bloki, będące nośnikami pól i przycisków akcji, umożliwiają użytkownikom elastyczne sterowanie wyświetlaniem całego widoku za pomocą tych reguł.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Uwaga**: Zanim reguły powiązań bloków zostaną wykonane, wyświetlanie bloku musi najpierw przejść **sprawdzenie uprawnień ACL**. Dopiero gdy użytkownik posiada odpowiednie uprawnienia dostępu, logika reguł powiązań bloków może zostać zastosowana. Innymi słowy, reguły powiązań bloków wchodzą w życie dopiero po spełnieniu wymagań uprawnień ACL do podglądu. Jeśli nie ma zdefiniowanych reguł powiązań bloków, blok jest wyświetlany domyślnie.

### Sterowanie blokami za pomocą zmiennych globalnych

**Reguły powiązań bloków** wspierają użycie zmiennych globalnych do dynamicznego kontrolowania zawartości wyświetlanej w blokach, dzięki czemu użytkownicy o różnych rolach i uprawnieniach mogą widzieć i wchodzić w interakcje z dostosowanymi widokami danych. Na przykład, w systemie zarządzania zamówieniami, choć różne role (takie jak administratorzy, sprzedawcy i pracownicy działu finansowego) mają uprawnienia do przeglądania zamówień, pola i przyciski akcji, które są widoczne dla każdej roli, mogą się różnić. Konfigurując zmienne globalne, można elastycznie dostosować wyświetlane pola, przyciski akcji, a nawet zasady sortowania i filtrowania danych, w oparciu o rolę użytkownika, uprawnienia lub inne warunki.

#### Przykładowe zastosowania:

-   **Kontrola ról i uprawnień**: Kontrolowanie widoczności lub edytowalności niektórych pól w oparciu o uprawnienia różnych ról. Na przykład, sprzedawcy mogą jedynie przeglądać podstawowe informacje o zamówieniu, podczas gdy pracownicy działu finansowego mogą przeglądać szczegóły płatności.
-   **Spersonalizowane widoki**: Dostosowywanie różnych widoków bloków dla różnych działów lub zespołów, zapewniając, że każdy użytkownik widzi tylko treści związane z jego pracą, co zwiększa efektywność.
-   **Zarządzanie uprawnieniami do akcji**: Kontrolowanie wyświetlania przycisków akcji za pomocą zmiennych globalnych. Na przykład, niektóre role mogą jedynie przeglądać dane, podczas gdy inne mogą wykonywać akcje takie jak modyfikowanie lub usuwanie.

### Sterowanie blokami za pomocą zmiennych kontekstowych

Bloki mogą być również kontrolowane przez zmienne w kontekście. Na przykład, można użyć zmiennych kontekstowych takich jak „Bieżący rekord”, „Bieżący formularz” i „Bieżący rekord w oknie dialogowym” do dynamicznego wyświetlania lub ukrywania bloków.

Przykład: Blok „Informacje o szansie sprzedaży zamówienia” jest wyświetlany tylko wtedy, gdy status zamówienia to „Opłacone”.

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Więcej informacji na temat reguł powiązań znajdą Państwo w [Reguły powiązań](/interface-builder/linkage-rule).