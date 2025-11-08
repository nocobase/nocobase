## Basic Usage

The Template Printing plugin provides various syntaxes to flexibly insert dynamic data and logical structures into templates. Below are detailed syntax explanations and usage examples.

### Basic Replacement

Use placeholders in the format `{d.xxx}` for data replacement. For example:

- `{d.title}`: Reads the `title` field from the dataset.
- `{d.date}`: Reads the `date` field from the dataset.

**Example**:

Template Content:
```
Dear Customer,

Thank you for purchasing our product: {d.productName}.
Order ID: {d.orderId}
Order Date: {d.orderDate}

Wish you a pleasant experience!
```

Dataset:
```json
{
  "productName": "Smart Watch",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Rendered Result:
```
Dear Customer,

Thank you for purchasing our product: Smart Watch.
Order ID: A123456789
Order Date: 2025-01-01

Wish you a pleasant experience!
```

### Accessing Sub-objects

If the dataset contains sub-objects, you can access the properties of the sub-objects using dot notation.

**Syntax**: `{d.parent.child}`

**Example**:

Dataset:
```json
{
  "customer": {
    "name": "Alex Smith",
    "contact": {
      "email": "alex.smith@example.com",
      "phone": "+1-555-012-3456"
    }
  }
}
```

Template Content:
```
Customer Name: {d.customer.name}
Email Address: {d.customer.contact.email}
Phone Number: {d.customer.contact.phone}
```

Rendered Result:
```
Customer Name: Alex Smith
Email Address: alex.smith@example.com
Phone Number: +1-555-012-3456
```

### Accessing Arrays

If the dataset contains arrays, you can use the reserved keyword `i` to access elements in the array.

**Syntax**: `{d.arrayName[i].field}`

**Example**:

Dataset:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Template Content:
```
The first employee's last name is {d.staffs[i=0].lastname}, and the first name is {d.staffs[i=0].firstname}
```

Rendered Result:
```
The first employee's last name is Anderson, and the first name is James
```