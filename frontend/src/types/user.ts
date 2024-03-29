export enum DemographicError {
    NO_AGE = 'NO_AGE',
    NO_GENDER = 'NO_GENDER',
}

export interface Demographic {
    id: string;
    name: string;
}

export interface UserDemographics {
    age: string;
    gender: string;
    reference: string;
}

export interface UserClient {
    agreed: boolean;
    id: string;
    username: string;
    voice: boolean;
}

export interface StoredDemographics {
    username: string;
    age: Demographic;
    gender: Demographic;
    agreed: boolean;
}
