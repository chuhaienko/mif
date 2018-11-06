# mif
Node.js modular framework for microservices

## Main
`this.misc` - hash for misc data. Safe to own dev/user data

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

Priority: -1000

### Validator
`this.validator` - instance of [joi](https://github.com/hapijs/joi)

Priority: -990

### Auth
`this.auth` - hash of auth methods from dir ./auth

Priority: -980 
 
### Controllers
`this.controllers` - hash of controllers from dir ./controllers

Priority: -970
