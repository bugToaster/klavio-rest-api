import axios from 'axios';
import axiosRetry from 'axios-retry';

// Create axios instance
const axiosKlaviyo = axios.create({
    baseURL: 'https://a.klaviyo.com/api/',
    headers: {
        'Content-Type': 'application/json',
        revision: '2023-06-15',
    },
    timeout: 5000,
});

// Retry logic
axiosRetry(axiosKlaviyo, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => {
        const status: number | undefined = error?.response?.status;

        // Retry if:
        // - Network error (ECONNRESET, ENOTFOUND, etc.)
        // - 5xx errors
        // - 429 (rate limit)
        // - or status is undefined (network failure)
        return (
            axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            status === 429 ||
            (typeof status === 'number' && status >= 500) ||
            typeof status === 'undefined'
        );
    },
    onRetry: (retryCount, error) => {
        const status = error?.response?.status;
        console.log(`[Retry] Attempt ${retryCount} - Status: ${status ?? 'N/A'} - Message: ${error.message}`);
    },
});

export { axiosKlaviyo };
