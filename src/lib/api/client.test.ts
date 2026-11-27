import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'sorobanlard_token';
const MAX_RETRIES = 3;

function makeResponse(
  config: InternalAxiosRequestConfig,
  status: number,
): AxiosResponse {
  return {
    data: {},
    status,
    statusText: String(status),
    headers: {},
    config,
  };
}

function makeNetworkError(config: InternalAxiosRequestConfig) {
  const error = new Error('Network Error') as Error & {
    config?: InternalAxiosRequestConfig;
    isAxiosError?: boolean;
  };
  error.config = config;
  error.isAxiosError = true;
  return error;
}

async function loadClient() {
  vi.resetModules();
  const mod = await import('./client');
  return mod;
}

async function flushBackoff() {
  // backoffMs is 1s/2s/4s; advance enough to cover all retries.
  await vi.advanceTimersByTimeAsync(10_000);
}

describe('apiClient response interceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    window.location.href = 'http://localhost/';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it.each([429, 503])('retries %i up to MAX_RETRIES then rejects', async (status) => {
    const { apiClient } = await loadClient();
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw Object.assign(new Error(`Request failed with status ${status}`), {
        config,
        isAxiosError: true,
        response: makeResponse(config, status),
      });
    });
    apiClient.defaults.adapter = adapter;

    const request = apiClient.get('/retry').catch((err) => err);
    await flushBackoff();
    const result = await request;

    expect(adapter).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    expect(result).toBeInstanceOf(Error);
  });

  it.each([400, 401, 403, 404])('does not retry %i', async (status) => {
    const { apiClient } = await loadClient();
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw Object.assign(new Error(`Request failed with status ${status}`), {
        config,
        isAxiosError: true,
        response: makeResponse(config, status),
      });
    });
    apiClient.defaults.adapter = adapter;

    const request = apiClient.get('/no-retry').catch((err) => err);
    await flushBackoff();
    const result = await request;

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Error);
  });

  it('retries a network error with no response', async () => {
    const { apiClient } = await loadClient();
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw makeNetworkError(config);
    });
    apiClient.defaults.adapter = adapter;

    const request = apiClient.get('/network').catch((err) => err);
    await flushBackoff();
    const result = await request;

    expect(adapter).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    expect(result).toBeInstanceOf(Error);
  });

  it('clears the token and redirects to /login on 401', async () => {
    const { apiClient } = await loadClient();
    localStorage.setItem(TOKEN_KEY, 'secret-token');
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw Object.assign(new Error('Unauthorized'), {
        config,
        isAxiosError: true,
        response: makeResponse(config, 401),
      });
    });
    apiClient.defaults.adapter = adapter;

    const request = apiClient.get('/protected').catch((err) => err);
    await flushBackoff();
    await request;

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
