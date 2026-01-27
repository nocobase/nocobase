:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zaawansowane

## Wprowadzenie

Pracownicy AI mogą być przypisani do stron lub bloków. Po przypisaniu mogą Państwo skonfigurować zadania specyficzne dla bieżącej działalności, co umożliwi użytkownikom szybkie korzystanie z Pracownika AI do ich realizacji bezpośrednio na stronie lub w bloku.

## Przypisywanie Pracownika AI do strony

Po przejściu strony w tryb edycji interfejsu użytkownika (UI), w prawym dolnym rogu, obok przycisku szybkiego wywoływania Pracownika AI, pojawi się znak „+”. Po najechaniu kursorem na ten znak, wyświetli się lista dostępnych Pracowników AI. Wybranie jednego z nich spowoduje przypisanie go do bieżącej strony.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Po zakończeniu przypisywania, za każdym razem, gdy wejdą Państwo na stronę, w prawym dolnym rogu będzie widoczny Pracownik AI przypisany do tej strony.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## Przypisywanie Pracownika AI do bloku

Po przejściu strony w tryb edycji interfejsu użytkownika (UI), w bloku obsługującym ustawienia `Actions`, proszę wybrać menu `AI employees` w sekcji `Actions`, a następnie wskazać Pracownika AI. Spowoduje to przypisanie go do bieżącego bloku.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Po zakończeniu przypisywania, za każdym razem, gdy wejdą Państwo na stronę, w obszarze `Actions` bloku będzie widoczny Pracownik AI przypisany do tego bloku.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Konfigurowanie zadań

Po przejściu strony w tryb edycji interfejsu użytkownika (UI), proszę najechać kursorem na ikonę Pracownika AI przypisanego do strony lub bloku. Pojawi się przycisk menu. Proszę wybrać `Edit tasks`, aby przejść do strony konfiguracji zadań.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Na stronie konfiguracji zadań mogą Państwo dodać wiele zadań dla bieżącego Pracownika AI.

Każda zakładka reprezentuje niezależne zadanie. Proszę kliknąć znak „+” obok, aby dodać nowe zadanie.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formularz konfiguracji zadań:

- W polu `Title` (Tytuł) proszę wprowadzić tytuł zadania. Proszę krótko opisać jego zawartość. Ten tytuł pojawi się na liście zadań Pracownika AI.
- W polu `Background` (Tło) proszę wprowadzić główną treść zadania. Ta treść będzie używana jako prompt systemowy podczas rozmowy z Pracownikiem AI.
- W polu `Default user message` (Domyślna wiadomość użytkownika) proszę wprowadzić domyślną wiadomość, która zostanie automatycznie wypełniona w polu wprowadzania użytkownika po wybraniu zadania.
- W `Work context` (Kontekst pracy) proszę wybrać domyślne informacje kontekstowe aplikacji, które zostaną wysłane do Pracownika AI. Ta operacja jest identyczna jak w oknie dialogowym.
- Pole wyboru `Skills` (Umiejętności) pokazuje umiejętności dostępne dla bieżącego Pracownika AI. Mogą Państwo odznaczyć daną umiejętność, aby Pracownik AI zignorował ją i nie używał podczas wykonywania tego zadania.
- Pole wyboru `Send default user message automatically` (Automatycznie wyślij domyślną wiadomość użytkownika) konfiguruje, czy domyślna wiadomość użytkownika ma być wysyłana automatycznie po kliknięciu w celu wykonania zadania.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Lista zadań

Po skonfigurowaniu zadań dla Pracownika AI, będą one wyświetlane w wyskakującym okienku profilu Pracownika AI oraz w wiadomości powitalnej przed rozpoczęciem rozmowy. Kliknięcie zadania spowoduje jego wykonanie.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)