:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Campi della collezione

## Tipi di interfaccia dei campi

NocoBase classifica i campi nelle seguenti categorie, dal punto di vista dell'interfaccia:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipi di dati dei campi

Ogni interfaccia di campo ha un tipo di dato predefinito. Ad esempio, per i campi con interfaccia numerica (Number), il tipo di dato predefinito è `double`, ma può anche essere `float`, `decimal`, ecc. I tipi di dati attualmente supportati sono:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mappatura dei tipi di campo

Il processo per aggiungere nuovi campi al database principale è il seguente:

1. Selezionare il tipo di interfaccia
2. Configurare il tipo di dato opzionale per l'interfaccia corrente

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Il processo per la mappatura dei campi da fonti dati esterne è:

1. Mappare automaticamente il tipo di dato corrispondente (Field type) e il tipo di interfaccia utente (Field Interface) in base al tipo di campo del database esterno.
2. Modificare il tipo di dato e il tipo di interfaccia per renderli più adatti, se necessario.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)