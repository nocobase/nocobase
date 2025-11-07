# Set Validation Rules

## Introduction

Validation rules are used to ensure that user-input data meets expectations.

## Where to Set Field Validation Rules

### Configure Validation Rules for Collection Fields

Most fields support the configuration of validation rules. After a field is configured with validation rules, backend validation is triggered when data is submitted. Different types of fields support different validation rules.

- **Date field**

  
![20251028225946](https://static-docs.nocobase.com/20251028225946.png)


- **Number field**

  
![20251028230418](https://static-docs.nocobase.com/20251028230418.png)


- **Text field**

  In addition to limiting text length, text fields also support custom regular expressions for more refined validation.

  
![20251028230554](https://static-docs.nocobase.com/20251028230554.png)


### Frontend Validation in Field Configuration

Validation rules set in the field configuration will trigger frontend validation to ensure user input complies with the regulations.


![20251028230105](https://static-docs.nocobase.com/20251028230105.png)



![20251028230255](https://static-docs.nocobase.com/20251028230255.png)


**Text fields** also support custom regex validation to meet specific format requirements.


![20251028230903](https://static-docs.nocobase.com/20251028230903.png)