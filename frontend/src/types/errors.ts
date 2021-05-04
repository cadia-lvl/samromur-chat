export class MicError extends Error {
    constructor(message: string) {
        super(message);
        // Maintains proper stacktrace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MicError);
        }
        this.name = 'MicError';
    }
}

export class RTCError extends Error {
    constructor(message: string) {
        super(message);
        // Maintains proper stacktrace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RTCError);
        }
        this.name = 'RTCError';
    }
}
