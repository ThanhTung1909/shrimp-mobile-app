import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const tscBin = path.resolve(repoRoot, 'node_modules/.bin/tsc');

const tmpDir = mkdtempSync(path.join(tmpdir(), 'aqs402-test-'));

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
      path.join(repoRoot, 'src/services/apiClient.ts'),
      path.join(repoRoot, 'src/services/telemetryApi.ts'),
    ],
  })
);

execFileSync(tscBin, ['-p', path.join(tmpDir, 'tsconfig.json')], { stdio: 'pipe' });

const require = createRequire(import.meta.url);
const Module = require('node:module');

globalThis.__DEV__ = false;

let mockGetResponse = null;

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
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
  if (request === 'axios') {
    const instance = () => Promise.resolve({ data: {} });
    instance.defaults = { baseURL: 'http://localhost:3000' };
    instance.interceptors = { request: { use: () => {} }, response: { use: () => {} } };
    instance.get = async () => ({ data: mockGetResponse });
    return { default: { create: () => instance }, create: () => instance };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const {
  normalizeTelemetryHistoryResponse,
  telemetryApi,
} = require(path.join(tmpDir, 'dist/services/telemetryApi.js'));

const sampleRecords = [
  { id: 't1', temperature: 28.5, recordedAt: '2026-11-25T01:00:00Z' },
  { id: 't2', temperature: 29.0, recordedAt: '2026-11-25T02:00:00Z' },
];

test('1. Pre-AQS-303 nested wrapper { success, statusCode, message, data: { success, total, page, limit, data } }', () => {
  const raw = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: {
      success: true,
      total: 42,
      page: 2,
      limit: 50,
      data: sampleRecords,
    },
  };
  const res = normalizeTelemetryHistoryResponse(raw, { page: 2, limit: 50 });
  assert.deepEqual(res, { success: true, total: 42, page: 2, limit: 50, data: sampleRecords });
});

test('2. Post-AQS-303 wrapper { success, statusCode, message, data: { total, page, limit, totalPages, data } }', () => {
  const raw = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: {
      total: 10,
      page: 1,
      limit: 25,
      totalPages: 1,
      data: sampleRecords,
    },
  };
  const res = normalizeTelemetryHistoryResponse(raw);
  assert.deepEqual(res, { success: true, total: 10, page: 1, limit: 25, data: sampleRecords });
});

test('3. Direct paginated { total, page, limit, data } and non-finite metadata fallback', () => {
  const raw = { total: 5, page: 3, limit: 20, data: sampleRecords };
  assert.deepEqual(normalizeTelemetryHistoryResponse(raw), {
    success: true,
    total: 5,
    page: 3,
    limit: 20,
    data: sampleRecords,
  });

  const nonFiniteRaw = { total: Number.NaN, page: Number.POSITIVE_INFINITY, limit: Number.NaN, data: sampleRecords };
  assert.deepEqual(normalizeTelemetryHistoryResponse(nonFiniteRaw, { page: 7, limit: 35 }), {
    success: true,
    total: 2,
    page: 7,
    limit: 35,
    data: sampleRecords,
  });
});

test('4. Direct array [...] and { data: [...] }', () => {
  assert.deepEqual(normalizeTelemetryHistoryResponse(sampleRecords, { page: 4, limit: 15 }), {
    success: true,
    total: 2,
    page: 4,
    limit: 15,
    data: sampleRecords,
  });

  assert.deepEqual(normalizeTelemetryHistoryResponse({ data: sampleRecords }, { page: 2, limit: 30 }), {
    success: true,
    total: 2,
    page: 2,
    limit: 30,
    data: sampleRecords,
  });
});

test('5. null, undefined, invalid payload, and getTelemetryHistory integration', async () => {
  assert.deepEqual(normalizeTelemetryHistoryResponse(null, { page: 3, limit: 40 }), {
    success: true,
    total: 0,
    page: 3,
    limit: 40,
    data: [],
  });
  assert.deepEqual(normalizeTelemetryHistoryResponse(undefined), {
    success: true,
    total: 0,
    page: 1,
    limit: 100,
    data: [],
  });
  assert.deepEqual(normalizeTelemetryHistoryResponse('unexpected-string'), {
    success: true,
    total: 0,
    page: 1,
    limit: 100,
    data: [],
  });
  assert.deepEqual(normalizeTelemetryHistoryResponse({ foo: 'bar' }), {
    success: true,
    total: 0,
    page: 1,
    limit: 100,
    data: [],
  });

  mockGetResponse = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: { success: true, total: 2, page: 1, limit: 100, data: sampleRecords },
  };
  const apiRes = await telemetryApi.getTelemetryHistory('dev-1', { page: 1, limit: 100 });
  assert.deepEqual(apiRes, { success: true, total: 2, page: 1, limit: 100, data: sampleRecords });
});
