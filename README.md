## Description
Redux middleware to batch/throottle action automatically. 
Uses lodash [throttle](https://lodash.com/docs/4.17.15#throttle) to combine [redux actions](https://redux.js.org/basics/actions/) and [dispatch](https://redux.js.org/api/store/#dispatchaction) as one or just to throttle and send only the last one (set option merge: "false", see below).
Middleware improves performance for highload applications (e.g. trading/betting/etc with a lot of live data through sockets).

## Install
`npm i --save redux-batch-middleware`

## Test Coverage
![](./coverage/badge-functions.svg) ![](./coverage/badge-lines.svg) ![](./coverage/badge-statements.svg) ![](./coverage/badge-branches.svg)

## Config and properties
Config should be an object.
Where keys of this object are action types of [redux actions](https://redux.js.org/basics/actions/).
Config values explanations:
```javascript
{
  // Default value of you payload 
  // (REQUIRED)
  defaultValue: string | number | boolean | any[] | BaseObject;
  // Time needs to be waited for next dispatch. 
  // Means: your actions will be dispatched not ofter than this value. 
  // (REQUIRED)
  throttleTime: number;
  // Should your values be merged or not. 
  // Set false if you need your payload to be the last one, not merged. 
  // Also set false for primitive types 
  // (REQUIRED). (DEFAULT = true).
  shouldMerge: boolean;
  // If shouldMerge is true you can specify the key to merge the objects in array.
  // Otherwise you will get array of objects. Number of actions equals number of array items.
  // Check unionBy https://lodash.com/docs/4.17.15#unionBy
  // (OPTIONAL)
  mergeByKey?: string;
  // Enable logger for batching
  // (OPTIONAL). (DEFAULT = false)
  logger?: boolean;
  // Throttling options
  // Check https://lodash.com/docs/4.17.15#throttle
  // (OPTIONAL)
  throttleOptions?: ThrottleSettings;
};
```

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