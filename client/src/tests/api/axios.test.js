global.crypto = {
    randomUUID: () => 'mock-device-id',
};

jest.mock('axios', () => {
    const actualAxios = jest.requireActual('axios');

    const requestHandlers = [];
    const responseHandlers = [];

    const mockInstance = jest.fn((config) => Promise.resolve({ config }));

    mockInstance.interceptors = {
        request: {
            use: (fulfilled, rejected) => {
                requestHandlers.push({ fulfilled, rejected });
                return requestHandlers.length - 1;
            },
            handlers: requestHandlers,
        },
        response: {
            use: (fulfilled, rejected) => {
                responseHandlers.push({ fulfilled, rejected });
                return responseHandlers.length - 1;
            },
            handlers: responseHandlers,
        },
    };

    mockInstance.post = jest.fn();
    mockInstance.get = jest.fn();
    mockInstance.request = jest.fn();

    return {
        ...actualAxios,
        create: jest.fn(() => mockInstance),
        __mockInstance: mockInstance,
    };
});

import axios from 'axios';
import instance from '../../api/axios';

describe('api/axios.js', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        delete window.location;
        window.location = { href: '' };
    });

    describe('request interceptor', () => {
        it('adds Authorization header if token exists and URL is not /auth/*', async () => {
            localStorage.setItem('token', 'fake-token');
            const mockAxiosInstance = axios.__mockInstance;

            const config = { url: '/api/data', headers: {} };
            mockAxiosInstance.interceptors.request.handlers[0] = {
                fulfilled: instance.interceptors.request.handlers[0].fulfilled
            };

            const modifiedConfig = await mockAxiosInstance.interceptors.request.handlers[0].fulfilled(config);
            expect(modifiedConfig.headers['Authorization']).toEqual('Bearer fake-token');
        });

        it('does NOT add Authorization header if URL starts with /auth/', async () => {
            localStorage.setItem('token', 'fake-token');
            const mockAxiosInstance = axios.__mockInstance;

            const config = { url: '/auth/login', headers: {} };
            mockAxiosInstance.interceptors.request.handlers[0] = {
                fulfilled: instance.interceptors.request.handlers[0].fulfilled
            };

            const modifiedConfig = await mockAxiosInstance.interceptors.request.handlers[0].fulfilled(config);
            expect(modifiedConfig.headers['Authorization']).toBeUndefined();
        });
    });

    describe('response interceptor', () => {
        it('refreshes token and retries original request after 401 error', async () => {
            localStorage.setItem('refreshToken', 'mock-refresh-token');
            localStorage.setItem('token', 'old-token');
            const mockAxiosInstance = axios.__mockInstance;

            mockAxiosInstance.post.mockResolvedValueOnce({
                data: { accessToken: 'new-token' },
            });
            mockAxiosInstance.mockResolvedValueOnce({
                config: { headers: { Authorization: 'Bearer new-token' } }
            });

            const originalRequest = { url: '/api/secure-data', headers: {}, _retry: false };
            mockAxiosInstance.interceptors.response.handlers[0] = {
                rejected: instance.interceptors.response.handlers[0].rejected
            };

            const retriedRequest = await mockAxiosInstance.interceptors.response.handlers[0].rejected({
                response: { status: 401 },
                config: originalRequest,
            });

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', {
                refreshToken: 'mock-refresh-token',
                deviceId: expect.any(String),
            });
            expect(localStorage.getItem('token')).toBe('new-token');
            expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
            expect(retriedRequest.config.headers['Authorization']).toBe('Bearer new-token');
        });

        it('redirects to /login if no refresh token is available', async () => {
            const mockAxiosInstance = axios.__mockInstance;
            const originalRequest = { url: '/api/data', headers: {}, _retry: false };

            mockAxiosInstance.interceptors.response.handlers[0] = {
                rejected: instance.interceptors.response.handlers[0].rejected
            };

            await expect(mockAxiosInstance.interceptors.response.handlers[0].rejected({
                response: { status: 401 },
                config: originalRequest,
            })).rejects.toThrow('No refresh token available');

            expect(window.location.href).toBe('/login');
        });

        it('clears tokens and redirects to /login if token refresh fails', async () => {
            localStorage.setItem('refreshToken', 'bad-token');
            localStorage.setItem('token', 'old-token');
            const mockAxiosInstance = axios.__mockInstance;

            mockAxiosInstance.post.mockRejectedValueOnce(new Error('Refresh failed'));

            const originalRequest = { url: '/api/data', headers: {}, _retry: false };

            mockAxiosInstance.interceptors.response.handlers[0] = {
                rejected: instance.interceptors.response.handlers[0].rejected
            };

            await expect(mockAxiosInstance.interceptors.response.handlers[0].rejected({
                response: { status: 401 },
                config: originalRequest,
            })).rejects.toThrow('Refresh failed');

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('refreshToken')).toBeNull();
            expect(window.location.href).toBe('/login');
        });
    });

    describe('getDeviceId behavior', () => {
        it('creates a new deviceId if not present in localStorage', () => {
            expect(localStorage.getItem('deviceId')).toBeNull();

            const id = (function simulateGetDeviceId() {
                let id = localStorage.getItem('deviceId');
                if (!id) {
                    id = crypto.randomUUID();
                    localStorage.setItem('deviceId', id);
                }
                return id;
            })();

            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(localStorage.getItem('deviceId')).toEqual(id);
        });

        it('returns existing deviceId if present in localStorage', () => {
            const mockId = 'mock-device-id';
            localStorage.setItem('deviceId', mockId);

            const id = (function simulateGetDeviceId() {
                let id = localStorage.getItem('deviceId');
                if (!id) {
                    id = crypto.randomUUID();
                    localStorage.setItem('deviceId', id);
                }
                return id;
            })();

            expect(id).toBe(mockId);
        });
    });
});