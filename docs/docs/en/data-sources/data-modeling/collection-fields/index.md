# Overview

## Interface Types of Fields

NocoBase classifies fields into the following categories from the Interface perspective:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Field Data Types

Each Field Interface has a default data type. For instance, for fields with the Interface as a Number, the default data type is double, but it can also be float, decimal, etc. The data types currently supported are:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Field Type Mapping

The process for adding new fields to the main database is as follows:

1. Select the Interface type
2. Configure the optional data type for the current Interface

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

The process for field mapping from external data sources is:

1. Automatically map the corresponding data type (Field type) and UI type (Field Interface) based on the field type of the external database.
2. Modify to a more suitable data type and Interface type as needed

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)