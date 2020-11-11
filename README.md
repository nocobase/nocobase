
Development
----------

### Install Dependencies

~~~shell
# Install dependencies for root project
npm i

# Install dependencies for sub packages via lerna
npm run bootstrap
~~~

### Set Environment Variables

~~~shell
cp .env.example .env
~~~

### Test

~~~
# For all packages
npm test

# For specific package
npm test packages/<name>
~~~
