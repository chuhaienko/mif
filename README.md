# mif
Node.js modular framework for microservices

## Main
`this.local` - hash for local data. Safe for own dev/user data

`this.config` - hash of configs from dir ./config

`this.modules` - hash of modules from dir ./modules

`this.AppError` - Custom Error class. Can get object with properties `code`, `message`, `details`

`this.env(keyPath, defaultValue)` - returns environment value. Also handle value that is JSON

`this.getDirs()` - returns dirs paths

`this.getDates()` - returns event dates

`this.getStates()` - returns states of app 

## Modules
### Logger
`this.logger` - instance of [winston](https://github.com/winstonjs/winston)
`req.logger` - methods for logging in request

Priority: -1000

### Validator
`this.validator` - instance of [joi](https://github.com/hapijs/joi)

Priority: -990

### Auth
`this.auth` - hash of auth methods from dir ./auth

Priority: -980 
 
### Controllers
`this.controllers` - collections of controllers from dir ./controllers

Priority: -970

### Routes
`this.routes` - routes
`this.modules.routes.selectRoute(req)` - Return matched route or throw error with code 404 or 405
`this.modules.routes.appendReq(req, route)` - Append req object with necessary data (e.g. params)

Priority: -960

### BaseServer
`this.modules.*server.setPre(type, func)` - sets function for pre-event hook. Events: `controller`, `auth`, `handler`, `response`
Hook-function for `controller` gets `(app, req)`.
Hook-function for `auth` gets `(app, req, controller)`.
Hook-function for `handler` gets `(app, req, controller)`.
Hook-function for `response` gets `(app, req, controller, response)`.

### WebServer
Priority: -900

### AMQPServer
`this.services.request(serviceName, method, path, payload)` - make request to another service
`this.services.publish(name, payload)` - publish message
`req.services.request(serviceName, method, path, payload)` - make request to another service
`req.services.publish(name, payload)` - publish message
  
Priority: -900
