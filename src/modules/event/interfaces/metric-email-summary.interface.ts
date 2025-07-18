export interface MetricEmailSummary {
    metric: string;
    date: string;
    count: number;
    emails: string[];
    error?: any;
}
