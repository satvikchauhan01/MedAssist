export interface ApiResponse {
    success: boolean;
    message: string;
    role?: string;
    sessionId?: string;
    sessions?: any[];
    history?: any[];
    response?: string;
    phase?: string;
    topCandidates?: any[];
}