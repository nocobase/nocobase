# Modeling for simple shop scenario

## Installation

```bash
yarn build samples/shop-modeling
yarn pm add sample-shop-modeling
yarn enable sample-shop-modeling
```

## Test

Start the local development server:

```bash
yarn dev --server
```

### Products API

```bash
# create a product
curl -X POST -d '{"title": "iPhone 14 Pro", "price": "7999", "enabled": true, "inventory": 10}' "http://localhost:13000/api/products"

# list products
curl "http://localhost:13000/api/products"

# get product which id=1
curl "http://localhost:13000/api/products?filterByTk=1"
```

### Orders API

```bash
# create a order
curl -X POST -d '{"productId": 1, "quantity": 1, "totalPrice": "7999", "userId": 1}' 'http://localhost:13000/api/orders'

# list orders which userId=1 with product
curl 'http://localhost:13000/api/orders?filter={"userId":1}&appends=product'
```
