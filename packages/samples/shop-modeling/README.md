# Modeling for simple shop scenario

## Register

```ts
yarn pm add sample-shop-modeling
```

## Activate

```bash
yarn pm enable sample-shop-modeling
```

## Launch the app

```bash
# for development
yarn dev

# for production
yarn build
yarn start
```

## Connect to the API

### Products API

```bash
# create a product
curl -X POST -H "Content-Type: application/json" -d '{"title": "iPhone 14 Pro", "price": "7999", "enabled": true, "inventory": 10}' "http://localhost:13000/api/products"

# list products
curl "http://localhost:13000/api/products"

# get product which id=1
curl "http://localhost:13000/api/products?filterByTk=1"
```

### Orders API

```bash
# create a order
curl -X POST -H "Content-Type: application/json" -d '{"productId": 1, "quantity": 1, "totalPrice": "7999", "userId": 1}' 'http://localhost:13000/api/orders'

# list orders which userId=1 with product
curl 'http://localhost:13000/api/orders?filter={"userId":1}&appends=product'
```
