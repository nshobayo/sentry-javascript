import { Integration } from '@sentry/types';

import { installedIntegrations } from '../../src/integration';
import { initAndBind } from '../../src/sdk';
import { TestClient } from '../mocks/client';

declare var global: any;

const PUBLIC_DSN = 'https://username@domain/path';

jest.mock('@sentry/hub', () => ({
  getCurrentHub(): {
    bindClient(): boolean;
    getClient(): boolean;
  } {
    return {
      getClient(): boolean {
        return false;
      },
      bindClient(): boolean {
        return true;
      },
    };
  },
}));

class MockIntegration implements Integration {
  public constructor(name: string) {
    this.name = name;
  }
  public name: string;
  public setupOnce: () => void = jest.fn();
}

describe('SDK', () => {
  beforeEach(() => {
    global.__SENTRY__ = {};
    installedIntegrations.splice(0);
  });

  describe('initAndBind', () => {
    test('installs default integrations', () => {
      const DEFAULT_INTEGRATIONS: Integration[] = [
        new MockIntegration('MockIntegration 1'),
        new MockIntegration('MockIntegration 2'),
      ];
      initAndBind(TestClient, { dsn: PUBLIC_DSN, defaultIntegrations: DEFAULT_INTEGRATIONS });
      expect((DEFAULT_INTEGRATIONS[0].setupOnce as jest.Mock).mock.calls.length).toBe(1);
      expect((DEFAULT_INTEGRATIONS[1].setupOnce as jest.Mock).mock.calls.length).toBe(1);
    });

    test('not installs default integrations', () => {
      const DEFAULT_INTEGRATIONS: Integration[] = [
        new MockIntegration('MockIntegration 1'),
        new MockIntegration('MockIntegration 2'),
      ];
      initAndBind(TestClient, { dsn: PUBLIC_DSN, defaultIntegrations: false });
      expect((DEFAULT_INTEGRATIONS[0].setupOnce as jest.Mock).mock.calls.length).toBe(0);
      expect((DEFAULT_INTEGRATIONS[1].setupOnce as jest.Mock).mock.calls.length).toBe(0);
    });

    test('installs integrations provided through options', () => {
      const integrations: Integration[] = [
        new MockIntegration('MockIntegration 1'),
        new MockIntegration('MockIntegration 2'),
      ];
      initAndBind(TestClient, { dsn: PUBLIC_DSN, integrations });
      expect((integrations[0].setupOnce as jest.Mock).mock.calls.length).toBe(1);
      expect((integrations[1].setupOnce as jest.Mock).mock.calls.length).toBe(1);
    });

    test('installs merged default integrations, with overrides provided through options', () => {
      const DEFAULT_INTEGRATIONS: Integration[] = [
        new MockIntegration('MockIntegration 1'),
        new MockIntegration('MockIntegration 2'),
      ];
      const integrations: Integration[] = [
        new MockIntegration('MockIntegration 1'),
        new MockIntegration('MockIntegration 3'),
      ];
      initAndBind(TestClient, { dsn: PUBLIC_DSN, defaultIntegrations: DEFAULT_INTEGRATIONS, integrations });
      // 'MockIntegration 1' should be overridden by the one with the same name provided through options
      expect((DEFAULT_INTEGRATIONS[0].setupOnce as jest.Mock).mock.calls.length).toBe(0);
      expect((DEFAULT_INTEGRATIONS[1].setupOnce as jest.Mock).mock.calls.length).toBe(1);
      expect((integrations[0].setupOnce as jest.Mock).mock.calls.length).toBe(1);
      expect((integrations[1].setupOnce as jest.Mock).mock.calls.length).toBe(1);
    });

    test('installs integrations returned from a callback function', () => {
      const DEFAULT_INTEGRATIONS: Integration[] = [
        new MockIntegration('MockIntegration 1'),
        new MockIntegration('MockIntegration 2'),
      ];
      const newIntegration = new MockIntegration('MockIntegration 3');
      initAndBind(TestClient, {
        dsn: PUBLIC_DSN,
        // Take only the first one and add a new one to it
        defaultIntegrations: DEFAULT_INTEGRATIONS,
        integrations: (integrations: Integration[]) => integrations.slice(0, 1).concat(newIntegration),
      });
      expect((DEFAULT_INTEGRATIONS[0].setupOnce as jest.Mock).mock.calls.length).toBe(1);
      expect((newIntegration.setupOnce as jest.Mock).mock.calls.length).toBe(1);
      expect((DEFAULT_INTEGRATIONS[1].setupOnce as jest.Mock).mock.calls.length).toBe(0);
    });
  });
});
