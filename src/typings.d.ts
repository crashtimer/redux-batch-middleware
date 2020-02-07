// node modules
import { AnyAction, Dispatch } from 'redux';
import { Cancelable, ThrottleSettings } from 'lodash';

/**
 * The util gets the type from any element
 *
 * @template T element for getting a type.
 */
type ValueOf<T> = T[keyof T];

/**
 * Config for every action
 */
type BatchActionConfig = {
  throttleTime?: number;
  shouldMerge?: boolean;
  defaultValue?: {} | [];
  logger?: boolean;
  throttleOptions?: ThrottleSettings;
};

/**
 * Middleware state config
 * @template T - Key - Action name
 */
type Config<T extends string = string> = {
  [key in T]: BatchActionConfig;
}

/**
 * Storage where all data is stored. Unique for every action
 */
type BatchStorage = Array<unknown> | Record<string, unknown>;

/**
 * Handler function
 * 
 * @param dispatch - Redux dispatch
 */
type BatchRunner = ((dispatch: Dispatch<AnyAction>) => void) & Cancelable;

/**
 * Value of middleware state (unique for every action)
 * Includes handler, data (storage), config, counter
 */
type StateValue = {
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
type BatchState = {
  [key in string]: StateValue;
};
