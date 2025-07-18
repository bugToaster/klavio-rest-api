import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

// Create a custom axios instance for Klaviyo
const axiosKlaviyo = axios.create({
    baseURL: 'https://a.klaviyo.com/api/',
    headers: {
        'Content-Type': 'application/json',
        revision: '2023-06-15',
    },
    timeout: 50000, // ms
});

// Add retry logic
axiosRetry(axiosKlaviyo, {
    retries: 3,
    retryDelay: (retryCount: number) => retryCount * 1000, // 1s, 2s, 3s
    retryCondition: (error: AxiosError) => {
        const status = error.response?.status;

        return (
            axiosRetry.isNetworkError(error) || // ECONNRESET, ETIMEDOUT, etc.
            status === 429 || // Too many requests
            (typeof status === 'number' && status >= 500) || // Server errors
            typeof status === 'undefined' // No response
        );
    },
    onRetry: (retryCount: number, error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url ?? 'unknown URL';

        console.warn(
            `[axios-retry] Retry #${retryCount} for ${url} - Status: ${status ?? 'N/A'} - ${error.message}`
        );
    },
});

export { axiosKlaviyo };
