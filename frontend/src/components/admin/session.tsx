import * as React from 'react';
import styled from 'styled-components';

import * as api from '../../services/api';
import { ages, genders, references } from '../../constants/demographics';
import { SessionMetadata } from '../../types/sessions';
import { getHumanReadableTime, splitSeconds } from '../../utilities/utils';

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

const ReferenceText = styled.span`
    font-weight: 600;
    text-align: left;
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

const Button = styled.button`
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
    border: none

    :active {
        transform: translateY(2px);
    }
`;

interface Props {
    session: SessionMetadata;
    showPartial: boolean;
}

export const Session: React.FunctionComponent<Props> = ({
    session,
    session: { client_a, client_b },
    showPartial,
}) => {
    const participantA = 'Viðmælandi a';
    const participantB = 'Viðmælandi b';
    const yearsOld = 'ára';
    const sampleRateMeasurement = 'hz';
    const reference = 'Tilvísun: ';

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

    const a_time = client_a
        ? getHumanReadableTime(splitSeconds(client_a.duration_seconds))
        : '0 mín.';
    const b_time = client_b
        ? getHumanReadableTime(splitSeconds(client_b.duration_seconds))
        : '0 mín.';
    /**
     * Fetches the reference person of the session
     * @returns the reference of client A, or null if not found in the list of references
     */
    const getReference = (): string => {
        const reference = references.find(
            (val) =>
                val.id === client_a?.reference || val.id === client_b?.reference
        );
        return reference ? reference.name : '';
    };

    if (
        showPartial ||
        (client_a?.duration_seconds && client_b?.duration_seconds)
    ) {
        return (
            <SessionContainer>
                <TitleContainer>{session.session_id}</TitleContainer>
                <Clients>
                    {client_a && (
                        <ClientContainer>
                            <Subtitle>{participantA}</Subtitle>
                            <span>{getGender(client_a.gender)}</span>
                            <span>
                                {getAge(client_a.age)} {yearsOld}
                            </span>
                            <span>
                                {client_a.sample_rate} {sampleRateMeasurement}
                            </span>
                            <span>{a_time}</span>
                        </ClientContainer>
                    )}
                    {client_b && (
                        <ClientContainer>
                            <Subtitle>{participantB}</Subtitle>
                            <span>{getGender(client_b.gender)}</span>
                            <span>
                                {getAge(client_b.age)} {yearsOld}
                            </span>
                            <span>
                                {client_b.sample_rate} {sampleRateMeasurement}
                            </span>
                            <span>{b_time}</span>
                        </ClientContainer>
                    )}
                    {getReference() && (
                        <ClientContainer>
                            <ReferenceText>
                                {reference} {getReference()}
                            </ReferenceText>
                        </ClientContainer>
                    )}
                </Clients>
                <Button onClick={handleClick}>Sækja</Button>
            </SessionContainer>
        );
    } else {
        return <></>;
    }
};

export default Session;
