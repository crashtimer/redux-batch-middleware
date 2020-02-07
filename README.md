## Description
Redux middleware to batch action automatically. Uses lodash throttle to combine actions and dispatch as one or just to throttle and send the last one (merge: "false").
Improves performance on high load applications (eg trading with a lot of live data through sockets).

## Install
`npm i --save redux-batch-middleware`

## Test Coverage
100% covered

## Usage
```javascript
import { applyMiddleware, createStore } from 'redux';
import throttleMiddleware from 'redux-batch-middleware';

// create a config
const throttleActionsConfig: ActionConfig = {
  CUSTOM_ACTION: {
    throttleTime: 5000,
	logger: true
  }
};

// create store
const store = createStore(
  reducer,
  applyMiddleware(logger)
)
```

#### Live testing example
Lets dispatch many "CUSTOM_ACTION" actions with different data within 5000ms ("throttleTime" we described above in config):

```
dispatch({
  type: "CUSTOM_ACTION",
  payload: { a: 1 }
});

dispatch({
  type: "CUSTOM_ACTION",
  payload: { b: 2 }
});

dispatch({
  type: "CUSTOM_ACTION",
  payload: { c: 3 }
});
```
#### Console output
![alt text](https://imgbbb.com/images/2020/02/07/logs.jpg)

#### Result
As the result this combined payload for action "CUSTOM_ACTION" will be dispatched to reducer