// node modules
import { Middleware, AnyAction, Dispatch } from 'redux';
import { throttle, merge, defer } from 'lodash';
// typings
import { BatchActionConfig, Config, BatchState, StateValue } from './typings';

/**
 * Middleware state
 */
let state: BatchState = {};

/**
 * Gets state of middleware
 * Include config, runner function, data, counter for each action
 * 
 * @returns - Current state of middleware
 */
export const getState = () => ({ ...state });

/**
 * Provides an empty state of storage
 * 
 * @param value - Object or Array type
 * 
 * @returns - Default value of storage
 */
export const getDefaultValue = (
  value: StateValue['config']['defaultValue'],
) => Array.isArray(value) ? [] : {}

/**
 * Resets state
 */
export const resetRunner = () => {
  state = {};
};

/**
 * Throttle middleware:
 * Skips throttling if it's already batched or action is not defined in config
 * Merges or overwrites the value in storage (based on config, default - merge)
 * Increases current counter of batched actions
 * Runs runner, decorated by lodash/throttle
 *
 * @param action Redux AnyAction type
 * 
 */
export const middleware: Middleware = (
  { dispatch },
) => (next) => (action: AnyAction) => {
  // current action data
  const { type, payload, meta } = action;

  // skip if throttled or isn't specified in config
  if (meta?.isThrottled || !state[type]) {
    return next(action);
  }

  // makes action async
  defer(() => {
    // data of cur
    const { config, data, runner } = state[type];
    const { shouldMerge } = config;

    // merge data (based on config)
    if (shouldMerge) {
      state[type].data = merge(data, payload);
    } else { // overwrite action data in storage (based on config)
      state[type].data = payload;
    }

    // increase counter
    state[type].counter += 1;

    // run runner
    runner(dispatch);
  });
};

/**
 * Runner creator (handler function).
 *
 * @param type - Action key (from config)
 * @param logger - Flag to enable logs (from config)
 * @param defaultValue - Default value (from config)
 * 
 * @return - Function which accepts Dispatch function
 */
export const createRunner = (
  type: keyof Config, 
  logger: BatchActionConfig['logger'],
  defaultValue: BatchActionConfig['defaultValue'],
) => (dispatch: Dispatch) => {
  // get payload data
  const payload = Object.assign(
    getDefaultValue(defaultValue),
    defaultValue,
    state[type].data,
  );

  // prints info of batched actions
  if (logger) {
    console.log(`Batched ${type}: ${state[type].counter}`, payload);
  }

  // dispatch batched actions with isThrottled meta
  dispatch({
    type,
    payload,
    meta: {
      isThrottled: true,
    },
  });

  // reset state
  state[type].data = getDefaultValue(defaultValue);
  // reset counter
  state[type].counter = 0;
};

/**
 * Init function.
 * Parses config and creates middleware state
 *
 * @param actionsConfig - Action config
 * 
 * @return - Middleware
 */
export const init = (actionsConfig: Config) => {
  // go through all actions
  Object.entries(actionsConfig).forEach(([type, value]) => {
    // get all values of config
    const {
      throttleTime = 2000,
      defaultValue = {},
      logger = false,
      throttleOptions = {},
      shouldMerge = true,
    } = value;

    // set state
    state[type] = {
      counter: 0,
      config: {
        throttleTime,
        defaultValue,
        logger,
        throttleOptions,
        shouldMerge,
      },
      data: getDefaultValue(defaultValue),
      runner: throttle(
        createRunner(type, logger, defaultValue),
        throttleTime,
        throttleOptions,
      ),
    };
  });

  return middleware;
};

export default init;
