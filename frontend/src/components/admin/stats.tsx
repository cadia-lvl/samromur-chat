import * as React from 'react';
import styled from 'styled-components';
import { SessionMetadata } from '../../types/sessions';
import { getHumanReadableTime, splitSeconds } from '../../utilities/utils';
import { Stat } from './stat';

interface Props {
    sessions: SessionMetadata[];
}

const StatsContainer = styled.div`
    margin-bottom: 1rem;
`;

export const Stats: React.FunctionComponent<Props> = (props) => {
    let numberOfRecordings = 0.0;
    let numberOfHalfRecordings = 0.0;
    let totalTime = 0.0;

    const { sessions } = props;

    for (const session of sessions) {
        const { client_a, client_b } = session;
        // Count larger value from client_a or b
        client_a.duration_seconds > client_b.duration_seconds
            ? (totalTime += client_a.duration_seconds)
            : (totalTime += client_b.duration_seconds);

        // If client a or b is missing their sound, add as half recording
        client_a.duration_seconds && client_b.duration_seconds
            ? numberOfRecordings++
            : numberOfHalfRecordings++;
    }

    return (
        <StatsContainer>
            <Stat name={'Samtöl'} value={numberOfRecordings} />
            <Stat name={'Ófullkomin samtöl'} value={numberOfHalfRecordings} />
            <Stat
                name={'Heildarlengd samtala'}
                value={getHumanReadableTime(splitSeconds(totalTime))}
            />
        </StatsContainer>
    );
};
