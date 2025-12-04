:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Instrukcje konfiguracji

### Aktywacja funkcji drukowania szablonów
Drukowanie szablonów jest obecnie dostępne dla bloków szczegółów i bloków tabel. Poniżej przedstawiamy sposób konfiguracji dla obu typów bloków.

#### Bloki szczegółów

1.  **Otwieranie bloku szczegółów**:
    -   W aplikacji proszę przejść do bloku szczegółów, w którym chce Pan/Pani skorzystać z funkcji drukowania szablonów.

2.  **Dostęp do menu operacji konfiguracyjnych**:
    -   W górnej części interfejsu proszę kliknąć menu „Konfiguracja operacji”.

3.  **Wybór opcji „Drukowanie szablonów”**:
    -   W menu rozwijanym proszę kliknąć opcję „Drukowanie szablonów”, aby aktywować funkcję wtyczki.

![Aktywacja drukowania szablonów](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Konfiguracja szablonów

1.  **Dostęp do strony konfiguracji szablonów**:
    -   W menu konfiguracji przycisku „Drukowanie szablonów” proszę wybrać opcję „Konfiguracja szablonów”.

![Opcja konfiguracji szablonów](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Dodawanie nowego szablonu**:
    -   Proszę kliknąć przycisk „Dodaj szablon”, aby przejść do strony dodawania szablonów.

![Przycisk dodawania szablonu](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Wypełnianie informacji o szablonie**:
    -   W formularzu szablonu proszę podać nazwę szablonu i wybrać jego typ (Word, Excel, PowerPoint).
    -   Proszę przesłać odpowiedni plik szablonu (obsługiwane formaty to `.docx`, `.xlsx`, `.pptx`).

![Konfiguracja nazwy i pliku szablonu](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Edycja i zapisywanie szablonu**:
    -   Proszę przejść do strony „Lista pól”, skopiować pola i wypełnić nimi szablon.
    ![Lista pól](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   Po wypełnieniu wszystkich szczegółów proszę kliknąć przycisk „Zapisz”, aby zakończyć dodawanie szablonu.

5.  **Zarządzanie szablonami**:
    -   Proszę kliknąć przycisk „Użyj” po prawej stronie listy szablonów, aby aktywować szablon.
    -   Proszę kliknąć przycisk „Edytuj”, aby zmodyfikować nazwę szablonu lub zastąpić plik szablonu.
    -   Proszę kliknąć przycisk „Pobierz”, aby pobrać skonfigurowany plik szablonu.
    -   Proszę kliknąć przycisk „Usuń”, aby usunąć niepotrzebne szablony. System poprosi o potwierdzenie operacji, aby uniknąć przypadkowego usunięcia.
    ![Zarządzanie szablonami](https://static-docs.nocobase.com/20250107140436.png)

#### Bloki tabel

Użycie bloków tabel jest zasadniczo takie samo jak bloków szczegółów, z następującymi różnicami:

1.  Obsługa drukowania wielu rekordów: Najpierw należy zaznaczyć rekordy do wydrukowania. Można wydrukować do 100 rekordów jednocześnie.
    
![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  Zarządzanie izolacją szablonów: Szablony dla bloków tabel i bloków szczegółów nie są wzajemnie wymienne — wynika to z różnic w strukturach danych (jeden to obiekt, drugi to tablica).