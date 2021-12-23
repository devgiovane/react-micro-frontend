ARG NODE_VERSION=16-alpine
FROM node:${NODE_VERSION}
RUN apk add bash
ENV NODE_ENV development
WORKDIR /usr/app
COPY package.json .
RUN yarn
EXPOSE 3002
ENTRYPOINT [ "yarn" ]
CMD [ "start" ]
