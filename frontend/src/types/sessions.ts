export interface ClientMetadata {
    age: string;
    duration_seconds: number;
    gender: string;
    sample_rate: number;
    session_id: string;
}

export interface SessionMetadata {
    session_id: string;
    client_a: ClientMetadata;
    client_b: ClientMetadata;
}