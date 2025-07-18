export interface BulkEventResult {
    success: boolean;
    eventName: string;
    profile: Record<string, any>;
    data?: any;
    error?: any;
}
