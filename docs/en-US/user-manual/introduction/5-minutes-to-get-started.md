# 5 minutes to get started

Let's take 5 minutes to build an order management system using NocoBase.

## 1. Create data collections and fields

In this order management system, we need to have the information of `Customers`,`Products`,`Orders` which are interrelated with each other. We need to create 4 data tables and their fields as follows:

- Customers
    - Name
    - Birthday
    - Gender
    - Phone
    - Orders (All orders purchased, data from `Orders`, each customer data contains multiple order data)
- Products
    - Product name
    - Description
    - Images
    - Price
    - Order Items (In which orders the product was purchased, data from `Order Items`, each product data belongs to multiple Order Items data)
- Orders
    - Serial number
    - Total
    - Note
    - Address
    - Customer (Customers who own the order, data from `Customers`, each order data belongs to a customer data)
    - Order Items (The products in the order, data from `Order Items`, each order data contains multiple Order Items data)
- Order Items
    - Order (The order to which the item belongs, data from `Orders`, each order item data belongs to an order data)
    - Product (The products contained in this item, data from `Products`, each order item data contains a product data)
    - Quantity

Where the fields with underscores are relational fields, associated to other data tables.

Next, click the "Collections & Fields" button to enter the Configuration screen and create the first Collection `Customers`. 

![1.customers.gif](./5-minutes-to-get-started/1.customers.gif)

Then click on "Configure fields" to add a name field for `Customers`, which is a Single line text type.

![2.field.gif](./5-minutes-to-get-started/2.field.gif)

In the same way, add Birthday, Gender, and Phone for `Customers`, which are the Datetime type, Radio group type, and Phone type respectively.

![1.fields.jpg](./5-minutes-to-get-started/1.fields.jpg)

In the same way, create Collections `Products`, `Orders`, `Order Items` and their fields.

![1.collections.jpg](./5-minutes-to-get-started/1.collections.jpg)

 

In this case, for the relationship fields, we have to select the Link to type, thus creating an association between the data collections. In this example, we associate `Products` with `Orders` and use `Order Items` as an junction collection.

![1.relation.jpg](./5-minutes-to-get-started/1.relation.jpg)

Once the data collections and fields are created, we start making the interface.

## 2. Configure menus and pages

We need three pages for customers, orders, and products to display and manage our data.

Click the UI Editor button to enter the interface configuration mode. In this mode, we can add menu items, add pages, and arrange blocks within the pages.

![1.editor.gif](./5-minutes-to-get-started/1.editor.gif)

Click Add menu item, add menu groups "Customers" and "Orders & Products", then add submenu pages "All Orders" and "Products".

![1.menu.gif](./5-minutes-to-get-started/1.menu.gif)

After adding menus and pages, we can add and configure blocks within the pages.

## 3. Adding and Configuring Blocks

NocoBase currently supports table, kanban, calendar, form, items, and other types of blocks that present data from a data collection and allow manipulation of the data. Obviously, customers, orders, and products are suitable for displaying and manipulating in a table block.

We add a table block to the "All Orders" page, select Collection `Orders` as the data source, and configure the columns to be displayed for this table block.

![1.block.gif](./5-minutes-to-get-started/1.block.gif)

Configure actions for this table block, including filter, add, delete, view, and edit.

![1.action.gif](./5-minutes-to-get-started/1.action.gif)

Configure form and item blocks for add, edit, view actions.

![1.action-block.gif](./5-minutes-to-get-started/1.action-block.gif)

Then, lay out the form blocks on the Products and Customers pages with the same method. When you are done, exit the UI Editor mode and enter the usage mode, and a simple order management system is completed.

![1.finished.gif](./5-minutes-to-get-started/1.finished.gif)
