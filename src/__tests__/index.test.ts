import { 
  init, 
  resetRunner, 
  middleware, 
  createRunner, 
  getDefaultValue,
  getState as getMiddlewareState, 
} from '../index';

const actionName = 'CUSTOM_ACTION';

const defaultConfig = {
  throttleTime: 2000,
  defaultValue: {},
  logger: false,
  throttleOptions: {},
  shouldMerge: true,
};

const customConfig = {
  [actionName]: {
    shouldMerge: false,
    throttleTime: 200,
    logger: false,
    defaultValue: {},
    throttleOptions: {
      leading: false,
      trailing: false,
    }
  },
};

const baseAction = {
  type: actionName,
};

const payloadObject = {
  test: 123,
}

describe('Throttle middleware', () => {
  beforeEach(() => {
    resetRunner();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('setup', () => {
    test('initial state should be empty object', () => {
      expect(getMiddlewareState()).toEqual({});
    });
      
    test('setup: empty config', () => {
      init({});
  
      expect(getMiddlewareState()).toEqual({});
    });
  
    test('setup: one action, empty config', () => {
      init({
        CUSTOM_ACTION: {}
      });
  
      const state = getMiddlewareState().CUSTOM_ACTION;
  
      expect(state.counter).toEqual(0);
      expect(state.config).toEqual(defaultConfig);
      expect(state.data).toEqual({});
      expect(state.runner).toBeInstanceOf(Function);
    });

    test('setup: one action, full config (array)', () => {
      const configWithArrayType = { 
        ...customConfig, 
          [actionName]: {
          ...customConfig[actionName],
          defaultValue: [],
        } 
      }

      init(configWithArrayType);
  
      const state = getMiddlewareState().CUSTOM_ACTION;

      expect(state.counter).toEqual(0);
      expect(state.config).toEqual(configWithArrayType[actionName]);
      expect(state.data).toEqual([]);
      expect(state.runner).toBeInstanceOf(Function);
    });

    describe('createRunner', () => {
      test('object + logger', () => {
        resetRunner();

        init({
          ...customConfig,
          [actionName]: {
            ...customConfig[actionName],
            logger: true,
          }
        });

        const dispatch = jest.fn();
        // const runner = jest.spyOn(state, 'runner');
        const consoleFn = jest.spyOn(global.console, 'log').mockImplementation();

        // const state = getMiddlewareState()[actionName];

        const runner = createRunner(actionName, true, {});
      
        runner(dispatch);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(consoleFn).toBeCalledTimes(1);
        expect(consoleFn).toHaveBeenCalledWith(`Batched ${actionName}: 0`, {});
        
        expect(dispatch.mock.calls[0][0]).toEqual({
          type: actionName,
          payload: {},
          meta: {
            isThrottled: true,
          },
        });

        const newState = getMiddlewareState()[actionName];

        expect(newState.counter).toBe(0);
        expect(newState.data).toEqual({});
      });

      test('array + no logger', () => {
        resetRunner();

        init({
          ...customConfig,
          [actionName]: {
            ...customConfig[actionName],
            logger: false,
            defaultValue: [],
          }
        });

        const testData = [1,2,3,5];
        const state = getMiddlewareState()[actionName];
        const dispatch = jest.fn();
        const consoleFn = jest.spyOn(global.console, 'log').mockImplementation();
        const runner = createRunner(actionName, false, []);

        state.data = testData;
      
        runner(dispatch);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(consoleFn).toBeCalledTimes(0);
        
        expect(dispatch.mock.calls[0][0]).toEqual({
          type: actionName,
          payload: testData,
          meta: {
            isThrottled: true,
          },
        });

        const newState = getMiddlewareState()[actionName];

        expect(newState.counter).toBe(0);
        expect(newState.data).toEqual([]);
      });
    });

    describe('middleware', () => {
      beforeEach(() => {
        resetRunner();
        init(customConfig);
      });

      test('action: unknown action (not registered)', () => {
        const action = {
          type: 'TEST',
          payload: payloadObject,
        };
        
        const dispatch = jest.fn();
        const getState = jest.fn();
        const next = jest.fn();

        middleware({ dispatch, getState })(next)(action);

        expect(next.mock.calls.length).toBe(1);
        expect(next.mock.calls[0][0]).toEqual(action);
      });

      test('action: no merge', (done) => {
        const action = {
          ...baseAction,
          payload: payloadObject,
        };
        
        const dispatch = jest.fn();
        const getState = jest.fn();
        const next = jest.fn();

        middleware({ dispatch, getState })(next)(action);
        middleware({ dispatch, getState })(next)(action);
        middleware({ dispatch, getState })(next)(action);
        middleware({ dispatch, getState })(next)(action);

        const state = getMiddlewareState();

        expect(next.mock.calls.length).toBe(0);
        expect(state[actionName].counter).toBe(0);

        // wait for defered action
        setTimeout(() => {
          const state = getMiddlewareState();
          
          expect(state[actionName].counter).toBe(4);
          expect(state[actionName].data).toEqual(payloadObject);

          done();
        }, 50);
      });

      test('action: merge', (done) => {
        resetRunner();
        init({...customConfig, [actionName]: {
          ...customConfig[actionName],
          shouldMerge: true,
        }});

        const action = {
          ...baseAction,
          payload: payloadObject,
        };

        const payload2 = { a: 5555 };
        
        const dispatch = jest.fn();
        const getState = jest.fn();
        const next = jest.fn();

        middleware({ dispatch, getState })(next)({
          ...action, payload: payload2,
        });
        middleware({ dispatch, getState })(next)(action);

        const state = getMiddlewareState();

        expect(next.mock.calls.length).toBe(0);
        expect(state[actionName].counter).toBe(0);

        // wait for defered action
        setTimeout(() => {
          const state = getMiddlewareState();
          
          expect(state[actionName].counter).toBe(2);
          expect(state[actionName].data).toEqual({
            ...payloadObject, ...payload2,
          });

          done();
        }, 50);
      });

      test('shoul call next - batched action', (done) => {
        const dispatch = jest.fn();
        const getState = jest.fn();
        const next = jest.fn();

        middleware({ dispatch, getState })(next)({
          ...baseAction,
          meta: {
            isThrottled: true,
          }
        });

        const state = getMiddlewareState();

        expect(next.mock.calls.length).toBe(1);
        expect(state[actionName].counter).toBe(0);

        setTimeout(() => {
          expect(state[actionName].counter).toBe(0);
          expect(state[actionName].data).toEqual({});

          done();
        }, 50);
      });      
    });
  });

  describe('reset state', () => {
    test('should reset state', () => {
      resetRunner();

      expect(getMiddlewareState()).toEqual({});
    });
  });

  describe('get default value', () => {
    test('should return array', () => {
      expect(getDefaultValue([])).toEqual([]);
    });

    test('should return object', () => {
      expect(getDefaultValue('test')).toEqual({});
    });

    test('should return object', () => {
      expect(getDefaultValue({ a: 1, b: 2})).toEqual({});
    });
  });
});