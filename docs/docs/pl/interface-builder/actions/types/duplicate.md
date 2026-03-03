---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/actions/types/duplicate).
:::

# Duplikuj

## Wprowadzenie

Akcja Duplikuj pozwala użytkownikom na szybkie tworzenie nowych rekordów na podstawie istniejących danych. Obsługuje dwa tryby duplikowania: **Bezpośrednie duplikowanie** oraz **Duplikuj do formularza i kontynuuj wypełnianie**.

## Instalacja

Wtyczka wbudowana, nie wymaga oddzielnej instalacji.

## Tryb duplikowania

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Bezpośrednie duplikowanie

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Domyślnie wykonywane jako „Bezpośrednie duplikowanie”;
- **Pola szablonu**: Należy określić pola, które mają zostać zduplikowane. Obsługiwana jest opcja „Zaznacz wszystko”. Jest to konfiguracja wymagana.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Po zakończeniu konfiguracji wystarczy kliknąć przycisk, aby zduplikować dane.

### Duplikuj do formularza i kontynuuj wypełnianie

Skonfigurowane pola szablonu zostaną wprowadzone do formularza jako **wartości domyślne**. Użytkownicy mogą zmodyfikować te wartości przed przesłaniem, aby zakończyć proces duplikowania.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Konfiguracja pól szablonu**: Tylko zaznaczone pola zostaną przeniesione jako wartości domyślne.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Synchronizuj pola formularza

- Automatycznie analizuje pola już skonfigurowane w bieżącym bloku formularza jako pola szablonu;
- Jeśli pola bloku formularza zostaną zmodyfikowane w późniejszym czasie (np. poprzez dostosowanie komponentów pól powiązań), należy ponownie otworzyć konfigurację szablonu i kliknąć **Synchronizuj pola formularza**, aby zapewnić spójność.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Dane szablonu zostaną wypełnione jako domyślne wartości formularza, a użytkownik może je przesłać po ewentualnej modyfikacji, aby sfinalizować duplikowanie.

### Uwagi dodatkowe

#### Duplikowanie, Odniesienie, Wstępne ładowanie

Różne typy pól (typy powiązań) mają różną logikę przetwarzania: **Duplikowanie / Odniesienie / Wstępne ładowanie**. **Komponent pola** powiązania również wpływa na tę logikę:

- Wybór (Select) / Wybór rekordu (Record picker): Używane do **Odniesienia**
- Podformularz (Sub-form) / Podtabela (Sub-table): Używane do **Duplikowania**

**Duplikowanie**

- Zwykłe pola są duplikowane;
- `hasOne` / `hasMany` mogą być tylko duplikowane (te relacje nie powinny używać komponentów wyboru, takich jak Wybór jednokrotny lub Wybór rekordu; zamiast tego należy używać komponentów Podformularz lub Podtabela);
- Zmiana komponentu dla `hasOne` / `hasMany` **nie zmieni** logiki przetwarzania (pozostaje Duplikowaniem);
- W przypadku zduplikowanych pól powiązań można wybrać wszystkie pola podrzędne.

**Odniesienie**

- `belongsTo` / `belongsToMany` są traktowane jako Odniesienie;
- Jeśli komponent pola zostanie zmieniony z „Wybór jednokrotny” na „Podformularz”, relacja zmieni się z **Odniesienia na Duplikowanie** (gdy stanie się Duplikowaniem, wszystkie pola podrzędne stają się możliwe do wyboru).

**Wstępne ładowanie**

- Pola powiązań pod polem Odniesienia są traktowane jako Wstępne ładowanie;
- Pola wstępnego ładowania mogą stać się Odniesieniem lub Duplikatem po zmianie komponentu.

#### Zaznacz wszystko

- Zaznacza wszystkie **Pola duplikowane** oraz **Pola odniesienia**.

#### Rekord wybrany jako szablon danych będzie filtrował następujące pola:

- Klucze główne zduplikowanych danych powiązań są filtrowane; klucze główne dla Odniesienia i Wstępnego ładowania nie są filtrowane;
- Klucze obce;
- Pola, które nie zezwalają na duplikaty (Unikalne);
- Pola sortowania;
- Pola automatycznej numeracji (Sequence);
- Hasło;
- Utworzone przez, Data utworzenia;
- Ostatnio zaktualizowane przez, Data ostatniej aktualizacji.

#### Synchronizuj pola formularza

- Automatycznie analizuje pola skonfigurowane w bieżącym bloku formularza na pola szablonu;
- Po zmodyfikowaniu pól bloku formularza (np. dostosowaniu komponentów pól powiązań), należy ponownie przeprowadzić synchronizację, aby zapewnić spójność.