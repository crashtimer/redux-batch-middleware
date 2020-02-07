## Description
Redux middleware to batch action automatically. Uses lodash throttle to combine actions and dispatch as one or just to throttle and send the last one (merge: "false").
Improves performance on high load applications (eg trading with a lot of live data through sockets).

## Install
`npm i --save redux-batch-middleware`

## Usage
```javascript
import { applyMiddleware, createStore } from 'redux';
import throttleMiddleware from 'redux-batch-middleware';

// create a config
const throttleActionsConfig: ActionConfig = {
  YOUR_ACTION: {
    throttleTime: 5000,
  },
  YOUR_ANOTHER_ACTION: {
    throttleTime: 1200,
    defaultValue: [],
    shouldMerge: false,
    logger: true,
  },
};

// create store
const store = createStore(
  reducer,
  applyMiddleware(logger)
)
```