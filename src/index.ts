// node modules
import { Middleware, AnyAction, Dispatch } from 'redux';
import { throttle, merge, defer, Cancelable, ThrottleSettings, cloneDeep, uniqBy, unionBy } from 'lodash';

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
    const { shouldMerge, mergeByKey } = config;
    const _data = cloneDeep(data);
    const _payload = cloneDeep(payload);

    // merge data (based on config)
    if (shouldMerge && typeof _data === 'object') {
      // array type
      if (Array.isArray(_data)) {
        if (mergeByKey) {
          state[type].data = unionBy(_payload, _data, mergeByKey);
        } else {
          state[type].data = [..._data, ..._payload];
        }
      } else {
        // object type
        state[type].data = merge(_data, _payload);
      }
    } else { // overwrite action data in storage (based on config)
      state[type].data = _payload;
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
  const { data } = state[type];

  // prints info of batched actions
  if (logger) {
    console.log(`Batched ${type}: ${state[type].counter}`, data);
  }

  // dispatch batched actions with isThrottled meta
  dispatch({
    type,
    payload: cloneDeep(data),
    meta: {
      isThrottled: true,
    },
  });

  // reset state
  state[type].data = cloneDeep(defaultValue);
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
      defaultValue,
      logger = false,
      throttleOptions = {},
      shouldMerge = true,
      mergeByKey,
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
        mergeByKey,
      },
      data: cloneDeep(defaultValue),
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

/**
 * 
 * TYPINGS
 * 
 */

/**
 * The util gets the export type from any element
 *
 * @template T element for getting a export type.
 */
export type ValueOf<T> = T[keyof T];

/**
 * Base object type
 *
 * @template T value type
 */
export type BaseObject<T = any> = {
  [key in string]: T;
};

/**
 * Config for every action
 */
export type BatchActionConfig = {
  defaultValue: string | number | boolean | any[] | BaseObject;
  throttleTime: number;
  shouldMerge: boolean;
  mergeByKey?: string;
  logger?: boolean;
  throttleOptions?: ThrottleSettings;
};

/**
 * Middleware state config
 * @template T - Key - Action name
 */
export type Config = BaseObject<BatchActionConfig>;

/**
 * Storage where all data is stored. Unique for every action
 */
export type BatchStorage = BatchActionConfig['defaultValue'];

/**
 * Handler function
 * 
 * @param dispatch - Redux dispatch
 */
export type BatchRunner = ((dispatch: Dispatch<AnyAction>) => void) & Cancelable;

/**
 * Value of middleware state (unique for every action)
 * Includes handler, data (storage), config, counter
 */
export type StateValue = {
  runner: BatchRunner;
  data: BatchStorage;
  config: BatchActionConfig;
  counter: number;
};

/**
 * Root state of middleware
 * Key - action name (key)
 * Value - StateValue
 */
export type BatchState = BaseObject<StateValue>;
