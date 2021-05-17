import * as React from 'react';
import styled from 'styled-components';
import { SessionMetadata } from '../../types/sessions';
import { getHumanReadableTime, splitSeconds } from '../../utilities/utils';
import { Stat } from './stat';

interface Props {
    sessions: SessionMetadata[];
    partial: boolean;
}

const StatsContainer = styled.div`
    margin-bottom: 1rem;
`;

export const Stats: React.FunctionComponent<Props> = (props) => {
    let numberOfRecordings = 0.0;
    let numberOfHalfRecordings = 0.0;
    let totalTime = 0.0;

    const { sessions, partial } = props;

    for (const session of sessions) {
        const { client_a, client_b } = session;

        if (partial) {
            if (client_a && client_b) {
                // Count larger value from client_a or b
                client_a.duration_seconds > client_b.duration_seconds
                    ? (totalTime += client_a.duration_seconds)
                    : (totalTime += client_b.duration_seconds);

                // If client a or b is missing their sound, add as half recording
                client_a.duration_seconds && client_b.duration_seconds
                    ? numberOfRecordings++
                    : numberOfHalfRecordings++;
            } else {
                client_a
                    ? (totalTime += client_a.duration_seconds)
                    : (totalTime += client_b.duration_seconds);
                numberOfHalfRecordings++;
            }
        } else {
            // Don't show partial. Demand both that client a and be should exist and that their duration is greater than zero.
            if (
                client_a &&
                client_b &&
                client_a.duration_seconds &&
                client_b.duration_seconds
            ) {
                // Count larger value from client_a or b
                client_a.duration_seconds > client_b.duration_seconds
                    ? (totalTime += client_a.duration_seconds)
                    : (totalTime += client_b.duration_seconds);

                numberOfRecordings++;
            }
        }
    }

    return (
        <StatsContainer>
            <Stat name={'Fullkomin samtöl'} value={numberOfRecordings} />
            {partial && (
                <Stat
                    name={'Ófullkomin samtöl'}
                    value={numberOfHalfRecordings}
                />
            )}
            <Stat
                name={'Heildarlengd samtala'}
                value={getHumanReadableTime(splitSeconds(totalTime))}
            />
        </StatsContainer>
    );
};
