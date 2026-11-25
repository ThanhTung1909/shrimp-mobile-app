import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const tscBin = path.resolve(repoRoot, 'node_modules/.bin/tsc');

const tmpDir = mkdtempSync(path.join(tmpdir(), 'aqs403-test-'));

after(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

writeFileSync(
  path.join(tmpDir, 'env.d.ts'),
  'declare var process: { env: Record<string, string | undefined> };\ndeclare var __DEV__: boolean;\n'
);

writeFileSync(
  path.join(tmpDir, 'tsconfig.json'),
  JSON.stringify({
    extends: path.join(repoRoot, 'tsconfig.json'),
    compilerOptions: {
      outDir: path.join(tmpDir, 'dist'),
      rootDir: path.join(repoRoot, 'src'),
      module: 'commonjs',
      moduleResolution: 'bundler',
      noEmit: false,
    },
    files: [
      path.join(tmpDir, 'env.d.ts'),
      path.join(repoRoot, 'src/store/slices/pondSlice.ts'),
    ],
  })
);

execFileSync(tscBin, ['-p', path.join(tmpDir, 'tsconfig.json')], { stdio: 'pipe' });

const require = createRequire(import.meta.url);
const Module = require('node:module');

globalThis.__DEV__ = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mockPonds = [];
let telemetryImpl = async () => null;
let thresholdImpl = async () => [];
let cropImpl = async () => [];

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@reduxjs/toolkit') {
    return originalLoad.call(this, require.resolve('@reduxjs/toolkit'), parent, isMain);
  }
  if (request === 'axios') {
    const instance = () => Promise.resolve({ data: {} });
    instance.defaults = { baseURL: 'http://localhost:3000' };
    instance.interceptors = { request: { use: () => {} }, response: { use: () => {} } };
    return { default: { create: () => instance }, create: () => instance };
  }
  if (request === 'react-native') return { Platform: { OS: 'ios' } };
  if (request === 'expo-constants') return { default: { expoConfig: {} }, expoConfig: {} };
  if (request === 'expo-secure-store') {
    return {
      setItemAsync: async () => {},
      getItemAsync: async () => null,
      deleteItemAsync: async () => {},
    };
  }
  if (request.endsWith('secureStore')) {
    return {
      getAccessToken: async () => null,
      getRefreshToken: async () => null,
      saveTokens: async () => {},
      clearTokens: async () => {},
    };
  }
  if (request.endsWith('pondApi')) {
    return {
      PondStatus: { ACTIVE: 'ACTIVE', EMPTY: 'EMPTY', HARVESTED: 'HARVESTED' },
      pondApi: {
        getPonds: async () => ({ data: mockPonds }),
        getPondById: async () => null,
      },
    };
  }
  if (request.endsWith('farmApi')) {
    return { farmApi: { getFarms: async () => [{ farmId: 'f1', farmName: 'Farm 1' }] } };
  }
  if (request.endsWith('telemetryApi')) {
    return { telemetryApi: { getLatestTelemetry: (deviceId) => telemetryImpl(deviceId) } };
  }
  if (request.endsWith('thresholdApi')) {
    return { thresholdApi: { getPondThresholds: (pondId) => thresholdImpl(pondId) } };
  }
  if (request.endsWith('cropApi')) {
    return { cropApi: { getPondCrops: (pondId) => cropImpl(pondId) } };
  }
  if (request.endsWith('deviceApi')) {
    return { DeviceStatus: { ONLINE: 'ONLINE', OFFLINE: 'OFFLINE', MAINTENANCE: 'MAINTENANCE' } };
  }
  if (request.endsWith('authSlice')) {
    return {
      logoutThunk: { fulfilled: 'auth/logout/fulfilled' },
      logoutAllThunk: { fulfilled: 'auth/logoutAll/fulfilled' },
    };
  }
  if (request.includes('components/ui')) {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { configureStore } = require('@reduxjs/toolkit');
const pondSliceModule = require(path.join(tmpDir, 'dist/store/slices/pondSlice.js'));
const pondReducer = pondSliceModule.default;
const { fetchPonds, parseOptionalNumber } = pondSliceModule;

test('parseOptionalNumber handles valid numbers, numeric strings, 0, NaN, and Infinity', () => {
  assert.equal(parseOptionalNumber(null, undefined, '', '28.567'), 28.57);
  assert.equal(parseOptionalNumber(0, 12), 0);
  assert.equal(parseOptionalNumber('0'), 0);
  assert.equal(parseOptionalNumber(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY), null);
  assert.equal(parseOptionalNumber(Number.POSITIVE_INFINITY, '7.456'), 7.46);
  assert.equal(parseOptionalNumber('Infinity', 'bad', null), null);
});

test('fetchPonds executes concurrently via Promise.allSettled and isolates failures + non-array guards', async () => {
  const PER_POND_DELAY_MS = 60;
  mockPonds = [
    {
      pondId: 'p1',
      pondName: 'Ao 1',
      status: 'ACTIVE',
      farmId: 'f1',
      areaM2: 1000,
      depthM: 1.5,
      shrimpDensity: 80,
      devices: [{ deviceId: 'd1', deviceName: 'D1', status: 'ONLINE' }],
    },
    {
      pondId: 'p2',
      pondName: 'Ao 2',
      status: 'ACTIVE',
      farmId: 'f1',
      areaM2: 1000,
      depthM: 1.5,
      shrimpDensity: 80,
      devices: [{ deviceId: 'd2', deviceName: 'D2', status: 'ONLINE' }],
    },
    {
      pondId: 'p3',
      pondName: 'Ao 3',
      status: 'ACTIVE',
      farmId: 'f1',
      areaM2: 1000,
      depthM: 1.5,
      shrimpDensity: 80,
      devices: [{ deviceId: 'd3', deviceName: 'D3', status: 'ONLINE' }],
    },
    {
      pondId: 'p4',
      pondName: 'Ao 4',
      status: 'ACTIVE',
      farmId: 'f1',
      areaM2: 1000,
      depthM: 1.5,
      shrimpDensity: 80,
      devices: [{ deviceId: 'd4', deviceName: 'D4', status: 'ONLINE' }],
    },
    {
      pondId: 'p5',
      pondName: 'Ao 5',
      status: 'ACTIVE',
      farmId: 'f1',
      areaM2: 1000,
      depthM: 1.5,
      shrimpDensity: 80,
      devices: [{ deviceId: 'd5', deviceName: 'D5', status: 'ONLINE' }],
    },
  ];

  telemetryImpl = async (deviceId) => {
    await delay(PER_POND_DELAY_MS);
    if (deviceId === 'd2') {
      throw new Error('Telemetry timeout for d2');
    }
    return { deviceId, temperature: 28.4, ph: 7.8, dissolvedOxygen: 5.6 };
  };

  thresholdImpl = (pondId) => {
    if (pondId === 'p5') {
      throw new Error('Pond p5 fetch crashed synchronously');
    }
    return (async () => {
      await delay(PER_POND_DELAY_MS);
      if (pondId === 'p3') return null;
      return [{ metricName: 'temperature', minValue: 26, maxValue: 32, isActive: true }];
    })();
  };

  cropImpl = async (pondId) => {
    await delay(PER_POND_DELAY_MS);
    if (pondId === 'p4') return { invalid: true };
    return [
      {
        batchId: `c-${pondId}`,
        status: 'ACTIVE',
        shrimpSpecies: 'Vannamei',
        stockingDate: new Date().toISOString(),
      },
    ];
  };

  const store = configureStore({ reducer: { pond: pondReducer } });

  const start = Date.now();
  const action = await store.dispatch(fetchPonds());
  const elapsed = Date.now() - start;

  assert.equal(fetchPonds.fulfilled.match(action), true);
  assert.ok(elapsed < 220, `Expected concurrent execution < 220ms, took ${elapsed}ms`);

  const state = store.getState().pond;
  assert.equal(state.ponds.length, 5);
  assert.equal(state.latestTelemetryMap['p1'].temperature, 28.4);
  assert.equal(state.latestTelemetryMap['p2'], undefined);
  assert.equal(state.latestTelemetryMap['p3'].temperature, 28.4);
  assert.equal(state.latestTelemetryMap['p5'], undefined);
  assert.deepEqual(state.thresholdsMap['p3'], []);
  assert.equal(state.activeCropsMap['p4'], null);
  assert.equal(state.activeCropsMap['p1'].shrimpSpecies, 'Vannamei');
});
