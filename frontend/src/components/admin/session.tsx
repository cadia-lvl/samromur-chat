import * as React from 'react';
import styled from 'styled-components';

import * as api from '../../services/api';
import { ages, genders } from '../../constants/demographics';
import { SessionMetadata } from '../../types/sessions';
import { splitSeconds } from '../../utilities/utils';

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
    const participantA = 'Viðmælandi a';
    const participantB = 'Viðmælandi b';
    const yearsOld = 'ára';
    const sampleRateMeasurement = 'hz';
    const duration = 'lengd';

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

    const a_time = splitSeconds(client_a.duration_seconds);
    const b_time = splitSeconds(client_b.duration_seconds);

    return (
        <SessionContainer>
            <TitleContainer>{session.session_id}</TitleContainer>
            <Clients>
                <ClientContainer>
                    <Subtitle>{participantA}</Subtitle>
                    <span>{getGender(client_a.gender)}</span>
                    <span>
                        {getAge(client_a.age)} {yearsOld}
                    </span>
                    <span>
                        {client_a.sample_rate} {sampleRateMeasurement}
                    </span>
                    <span>
                        {duration} 00:{a_time.m1}
                        {a_time.m2}:{a_time.s1}
                        {a_time.s2}
                    </span>
                </ClientContainer>
                <ClientContainer>
                    <Subtitle>{participantB}</Subtitle>
                    <span>{getGender(client_b.gender)}</span>
                    <span>
                        {getAge(client_a.age)} {yearsOld}
                    </span>
                    <span>
                        {client_b.sample_rate} {sampleRateMeasurement}
                    </span>
                    <span>
                        {duration} 00:{b_time.m1}
                        {b_time.m2}:{b_time.s1}
                        {b_time.s2}
                    </span>
                </ClientContainer>
            </Clients>
            <Button onClick={handleClick}>Sækja</Button>
        </SessionContainer>
    );
};

export default Session;
