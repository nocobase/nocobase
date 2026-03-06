:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/get-started/system-requirements).
:::

# Wymagania systemowe

Wymagania systemowe opisane w niniejszym dokumencie dotyczą **samej usługi aplikacji NocoBase** i obejmują zasoby obliczeniowe oraz pamięć operacyjną wymagane przez procesy aplikacji. **Nie obejmują one zależnych usług stron trzecich**, w tym między innymi:

- Bram sieciowych API / odwrotnych serwerów proxy (Reverse Proxy)
- Usług bazodanowych (np. MySQL, PostgreSQL)
- Usług buforowania (np. Redis)
- Oprogramowania pośredniczącego, takiego jak kolejki komunikatów czy magazyny obiektowe

Poza scenariuszami służącymi wyłącznie do weryfikacji funkcjonalności lub celów eksperymentalnych, **zdecydowanie zaleca się niezależne wdrażanie powyższych usług stron trzecich** na oddzielnych serwerach lub w kontenerach, bądź bezpośrednie korzystanie z odpowiednich usług chmurowych.

Konfiguracja systemowa i planowanie wydajności tych usług powinny być oceniane i optymalizowane oddzielnie, w oparciu o **rzeczywistą ilość danych, obciążenie biznesowe oraz skalę współbieżności**.

## Tryb wdrażania jednowęzłowego

Tryb wdrażania jednowęzłowego oznacza, że usługa aplikacji NocoBase działa na pojedynczym serwerze lub instancji kontenera.

### Minimalne wymagania sprzętowe

| Zasób | Wymagania |
|---|---|
| CPU | 1 rdzeń |
| Pamięć RAM | 2 GB |

**Zastosowanie**:

- Mikroprzedsiębiorstwa
- Weryfikacja koncepcji (POC)
- Środowiska programistyczne / testowe
- Scenariusze z niemal zerowym ruchem współbieżnym

:::info{title=Wskazówka}

- Ta konfiguracja gwarantuje jedynie uruchomienie systemu, nie zapewnia jednak optymalnej wydajności.
- Wraz ze wzrostem ilości danych lub liczby zapytań współbieżnych, zasoby systemowe mogą szybko stać się wąskim gardłem.
- W przypadku **programowania kodu źródłowego, tworzenia wtyczek lub budowania i wdrażania z kodu źródłowego**, zaleca się zarezerwowanie **co najmniej 4 GB wolnej pamięci RAM**, aby zapewnić pomyślne zakończenie procesów instalacji zależności, kompilacji i budowania.

:::

### Zalecane wymagania sprzętowe

| Zasób | Zalecana konfiguracja |
|---|---|
| CPU | 2 rdzenie |
| Pamięć RAM | ≥ 4 GB |

**Zastosowanie**:

Odpowiednie dla małych i średnich firm oraz środowisk produkcyjnych z niewielką liczbą operacji współbieżnych.

:::info{title=Wskazówka}

- Przy tej konfiguracji system może obsługiwać standardowe operacje panelu administracyjnego oraz lekkie obciążenia biznesowe.
- Gdy wzrośnie złożoność biznesowa, liczba dostępów współbieżnych lub zadań w tle, należy rozważyć zwiększenie specyfikacji sprzętowej lub migrację do trybu klastra.

:::

## Tryb klastra

Przeznaczony dla średnich i dużych scenariuszy biznesowych o wysokiej współbieżności. Pozwala na skalowanie poziome w celu zwiększenia dostępności systemu i przepustowości biznesowej (szczegóły w sekcji: [Tryb klastra](/cluster-mode)).

### Wymagania sprzętowe węzła

W trybie klastra zalecana konfiguracja sprzętowa dla każdego węzła aplikacji (Pod / instancja) jest zgodna z trybem wdrażania jednowęzłowego.

**Minimalna konfiguracja pojedynczego węzła:**

- CPU: 1 rdzeń
- Pamięć RAM: 2 GB

**Zalecana konfiguracja pojedynczego węzła:**

- CPU: 2 rdzenie
- Pamięć RAM: 4 GB

### Planowanie liczby węzłów

- Liczbę węzłów w klastrze można rozszerzać w zależności od potrzeb (2–N).
- Rzeczywista liczba wymaganych węzłów zależy od:
  - Liczby współbieżnych dostępów
  - Złożoności logiki biznesowej
  - Obciążenia zadaniami w tle i przetwarzaniem asynchronicznym
  - Czasu odpowiedzi zewnętrznych usług zależnych

Zalecenia dla środowisk produkcyjnych:

- Dynamiczne dostosowywanie skali węzłów w oparciu o wskaźniki monitoringu (CPU, pamięć, opóźnienia zapytań itp.).
- Rezerwowanie pewnej nadwyżki zasobów w celu obsługi nagłych skoków ruchu.