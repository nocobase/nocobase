
 






## What is Number-to-words plugin?

The Numbers to Words plugin helps you convert numbers to words (in  English). It can also convert numbers to currency and apply decimal checks, making it ideal for a wide range of applications.




## Distinctive features

### 1. Currency check
-The plugin can also convert the converted number to a specific currency. For example, if the input number is 5000 and the desired currency is USD, the plugin would convert it to "five thousand dollars".


![NocoBase](https://github.com/codenuladev/codenula/blob/a7d6bf066c03b9d0ebc47ea48f89df6adca3df28/Capturefields2.PNG)


### 2. Decimal check
-The plugin can also apply decimal checks to the converted number. For example, if the input number is 5000.50, the plugin would convert it to "five thousand dollars and fifty cents".





## Installation

There are two ways to install the Numbers to Words plugin:

1. **Enable using GUI:**
    1. Go to Plugin Manager.
    2. Find `@codenula/plugin-numbers-to-words`.
    3. Enable the plugin.

2. **Enable using terminal:**
    1. Enter the following command to enable the plugin:

        ```
        yarn pm enable @codenula/plugin-numbers-to-words
        ```
## Usage

After enabling the plugin follow the below steps to use the plugin

1. **Selecting numberToWords from field Type:**
![wysiwyg](https://github.com/codenuladev/codenula/blob/c4a173d033a8e5aec0e21df8ebb5da453e0f52d4/dropdown%20ss.PNG)
    1. Go to your collection and click on `configure fields`.
    2. Click on `Add Fields` Button.
    3. Find `numbersToWords` and click on it.
    4. Set a field display name and field name.
    5. Select currency options from the dropdown.
    6. Write an Expression using existing fields (sum1+sum2).
    7. Select Calculation engine
    8. Click on submit.
    ![wysiwyg](https://github.com/codenuladev/codenula/blob/32bf5c6f8da588352610cbde1810eedd49230fbc/options.PNG) 
3. **Using in UI Editor:**
   ![wysiwyg](hhttps://github.com/codenuladev/codenula/blob/68ae65fac06bbe1259b9d89897c1f49c9547b0c3/demo.PNG)
    1. Select UI editor tab from top bar.
    2. Click on `Add Block` and select Form > {Your colection name}
    3. Click on configure fields inside the form block
    4. Enable all the fields that you configured
       ![wysiwyg](https://github.com/codenuladev/codenula/blob/c4a173d033a8e5aec0e21df8ebb5da453e0f52d4/form2.PNG)
    5. Enter some number inside the fields you want to operate on.
       
       
## License

- [Core packages](https://github.com/nocobase/nocobase/tree/main/packages/core) are [Apache 2.0 licensed](./LICENSE-APACHE-2.0).
- [Plugins packages](https://github.com/nocobase/nocobase/tree/main/packages/plugins) are [AGPL 3.0 licensed](./LICENSE-AGPL).
