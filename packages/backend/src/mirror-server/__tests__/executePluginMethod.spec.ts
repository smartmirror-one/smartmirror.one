import { executePluginMethod } from '../executePluginMethod';
import { Config, GlobalTest } from '../../types';

describe('executePluginMethod', () => {
  const exampleFunction = jest.fn();
  const exampleConfig: Config = (globalThis as unknown as GlobalTest)
    .getConfig({ backend: { exampleFunction }});

  it('executes a requested method', async () => {
    await executePluginMethod({
      config: exampleConfig,
      data: {},
      methodName: 'exampleFunction',
      widgetId: 'example-widget',
    });
    expect(exampleFunction).toBeCalledTimes(1);
  });

  it('returns null when the requested widget cannot be found', async () => {
    const result = await executePluginMethod({
      config: exampleConfig,
      data: {},
      methodName: 'exampleFunction',
      widgetId: 'example-foo',
    });
    expect(result).toBe(null);
  });

  it('returns null when the requested method cannot be found', async () => {
    const result = await executePluginMethod({
      config: exampleConfig,
      data: {},
      methodName: 'wrongFunction',
      widgetId: 'example-widget',
    });
    expect(result).toBe(null);
  });
});