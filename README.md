
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

### Build

~~~shell
# for all packages
npm run build

# for specific package
npm run build <package_name_1> <package_name_2> ...
~~~

### Test

~~~
# For all packages
npm test

# For specific package
npm test packages/<name>
~~~
