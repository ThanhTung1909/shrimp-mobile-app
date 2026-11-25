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

const tmpDir = mkdtempSync(path.join(tmpdir(), 'aqs401-test-'));

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
      path.join(repoRoot, 'src/services/authApi.ts'),
      path.join(repoRoot, 'src/services/socketService.ts'),
    ],
  })
);

execFileSync(tscBin, ['-p', path.join(tmpDir, 'tsconfig.json')], { stdio: 'pipe' });

const require = createRequire(import.meta.url);
const Module = require('node:module');

globalThis.__DEV__ = false;

const savedCalls = [];
const postCalls = [];
let mockRefreshPayload = {
  success: true,
  statusCode: 200,
  message: 'OK',
  data: { accessToken: 'acc', refreshToken: 'ref' },
};
let mockApiPostPayload = { success: true, data: { message: 'ok', isValid: true } };

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react-native') {
    return { Platform: { OS: 'ios' } };
  }
  if (request === 'expo-constants') {
    return { default: { expoConfig: {} }, expoConfig: {} };
  }
  if (request === 'expo-secure-store') {
    return {
      setItemAsync: async () => {},
      getItemAsync: async () => null,
      deleteItemAsync: async () => {},
    };
  }
  if (request === 'socket.io-client') {
    return {
      io: () => ({
        connected: false,
        on: () => {},
        emit: () => {},
        disconnect: () => {},
        connect: () => {},
        auth: {},
      }),
    };
  }
  if (request.endsWith('secureStore')) {
    return {
      getAccessToken: async () => 'old-access-token',
      getRefreshToken: async () => 'old-refresh-token',
      saveTokens: async (accessToken, refreshToken) => {
        savedCalls.push([accessToken, refreshToken]);
      },
      clearTokens: async () => {},
    };
  }
  if (request === 'axios') {
    const instance = (cfg) => Promise.resolve({ data: { ok: true }, config: cfg });
    instance.defaults = { baseURL: 'http://localhost:3000' };
    instance.interceptors = {
      request: { use: () => {} },
      response: {
        use: (_onFulfilled, onRejected) => {
          instance._onRejected = onRejected;
        },
      },
    };
    instance.post = async (url, body) => {
      postCalls.push({ url, body });
      return { data: mockApiPostPayload };
    };
    instance.get = async () => ({ data: { success: true, data: {} } });
    return {
      default: {
        create: () => instance,
        post: async (url, body) => {
          postCalls.push({ url, body });
          return { data: mockRefreshPayload };
        },
      },
      create: () => instance,
      post: async (url, body) => {
        postCalls.push({ url, body });
        return { data: mockRefreshPayload };
      },
    };
  }
  if (
    request.includes('pondSlice') ||
    request.includes('alertSlice') ||
    request.includes('uiSlice')
  ) {
    return {
      updateRealtimeTelemetry: (d) => d,
      addEmergencyAlert: (d) => d,
      fetchAlertsThunk: () => ({}),
      setSocketConnected: (b) => b,
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const {
  unwrapApiResponse,
  extractRefreshTokens,
  apiClient,
} = require(path.join(tmpDir, 'dist/services/apiClient.js'));
const { authApi } = require(path.join(tmpDir, 'dist/services/authApi.js'));
const { socketService } = require(path.join(tmpDir, 'dist/services/socketService.js'));

test('unwrapApiResponse unwraps TransformInterceptor response cleanly', () => {
  const raw = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: { accessToken: 'acc', refreshToken: 'ref' },
  };
  assert.deepEqual(unwrapApiResponse(raw), { accessToken: 'acc', refreshToken: 'ref' });
});

test('extractRefreshTokens rejects missing/empty tokens and refresh flows never save incomplete tokens', async () => {
  assert.throws(
    () => extractRefreshTokens({ success: true, statusCode: 200, data: { accessToken: 'acc' } }),
    /Refresh response missing accessToken or refreshToken/
  );
  assert.throws(
    () => extractRefreshTokens({ success: true, statusCode: 200, data: { refreshToken: 'ref' } }),
    /Refresh response missing accessToken or refreshToken/
  );
  assert.throws(
    () =>
      extractRefreshTokens({
        success: true,
        statusCode: 200,
        data: { accessToken: '   ', refreshToken: 'ref' },
      }),
    /Refresh response missing accessToken or refreshToken/
  );

  savedCalls.length = 0;
  mockRefreshPayload = { success: true, statusCode: 200, data: { accessToken: 'acc-only' } };

  await assert.rejects(
    () =>
      apiClient._onRejected({
        response: { status: 401 },
        config: { url: '/ponds', headers: {} },
      }),
    /Refresh response missing accessToken or refreshToken/
  );
  assert.equal(savedCalls.length, 0);

  await socketService.handleAuthError(new Error('jwt expired'));
  assert.equal(savedCalls.length, 0);

  mockRefreshPayload = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: { accessToken: 'new-acc', refreshToken: 'new-ref' },
  };
  await apiClient._onRejected({
    response: { status: 401 },
    config: { url: '/ponds', headers: {} },
  });
  assert.deepEqual(savedCalls, [['new-acc', 'new-ref']]);
});

test('sendOtp and verifyOtp default purpose to LOGIN when omitted and preserve explicit purpose', async () => {
  postCalls.length = 0;

  await authApi.sendOtp({ phoneNumber: '0901234567' });
  assert.equal(postCalls[0].url, '/auth/send-otp');
  assert.equal(postCalls[0].body.purpose, 'LOGIN');

  await authApi.sendOtp({ phoneNumber: '0901234567', purpose: 'CHANGE_PASSWORD' });
  assert.equal(postCalls[1].body.purpose, 'CHANGE_PASSWORD');

  await authApi.verifyOtp({ phoneNumber: '0901234567', otp: '123456' });
  assert.equal(postCalls[2].url, '/auth/verify-otp');
  assert.equal(postCalls[2].body.purpose, 'LOGIN');

  await authApi.verifyOtp({ email: 'a@b.com', otp: '654321', purpose: 'RESET_PASSWORD' });
  assert.equal(postCalls[3].body.purpose, 'RESET_PASSWORD');
  assert.equal(postCalls[3].body.email, 'a@b.com');
});

test('authApi.login unwraps nested data and preserves snake_case fallback', async () => {
  mockApiPostPayload = {
    success: true,
    statusCode: 200,
    data: {
      data: {
        userId: 'u-1',
        fullName: 'Nguyen Van A',
        access_token: 'acc-snake',
        refresh_token: 'ref-snake',
      },
    },
  };
  const loginRes = await authApi.login({ phoneNumber: '0901234567', password: 'secret' });
  assert.equal(loginRes.userId, 'u-1');
  assert.equal(loginRes.accessToken, 'acc-snake');
  assert.equal(loginRes.refreshToken, 'ref-snake');
});
