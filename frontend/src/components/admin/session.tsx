import * as React from 'react';
import styled from 'styled-components';

import * as api from '../../services/api';
import { ages, genders } from '../../constants/demographics';
import { SessionMetadata } from '../../types/sessions';

const SessionContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const TitleContainer = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    border-bottom: 1px solid gray;
    margin-bottom: 0.5rem;
`;

const Subtitle = styled.span`
    font-weight: 600;
`;

const Clients = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
`;

const ClientContainer = styled.div`
    width: 50%;
    display: flex;
    flex-direction: column;
`;

const Button = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 2rem;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 600;
    background-color: gray;
    color: white;
    margin-top: 0.5rem;

    :active {
        transform: translateY(2px);
    }
`;

interface Props {
    session: SessionMetadata;
}

export const Session: React.FunctionComponent<Props> = ({
    session,
    session: { client_a, client_b },
}) => {
    const getAge = (value: string): string => {
        const age = ages.find((val) => val.id === value);
        return age ? age.name : value;
    };

    const getGender = (value: string): string => {
        const gender = genders.find((val) => val.id === value);
        return gender ? gender.name : value;
    };

    const handleClick = () => {
        const id = session.session_id;
        api.downloadSession(id).catch((error) => console.error(error));
    };

    return (
        <SessionContainer>
            <TitleContainer>{session.session_id}</TitleContainer>
            <Clients>
                <ClientContainer>
                    <Subtitle>Viðmælandi a</Subtitle>
                    <span>{getGender(client_a.gender)}</span>
                    <span>{getAge(client_a.age)} ára</span>
                    <span>{client_a.sample_rate} hz</span>
                    <span>{client_a.duration_seconds} sekúndur</span>
                </ClientContainer>
                <ClientContainer>
                    <Subtitle>Viðmælandi b</Subtitle>
                    <span>{getGender(client_b.gender)}</span>
                    <span>{getAge(client_a.age)} ára</span>
                    <span>{client_b.sample_rate} hz</span>
                    <span>{client_b.duration_seconds} sekúndur</span>
                </ClientContainer>
            </Clients>
            <Button onClick={handleClick}>Sækja</Button>
        </SessionContainer>
    );
};

export default Session;
