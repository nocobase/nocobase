FROM node:12.20.0-stretch

WORKDIR /app
# COPY . /app
RUN ls -a

RUN npm config set registry https://registry.npmmirror.com
RUN yarn config set registry https://registry.npmmirror.com

# RUN npm install
# RUN npm run bootstrap
# RUN npm run build

# # Install app dependencies
# ENV NPM_CONFIG_LOGLEVEL warn
# RUN yarn install

# # Show current folder structure in logs
RUN ls -a

# CMD [ "npm", "run", "serve" ]
