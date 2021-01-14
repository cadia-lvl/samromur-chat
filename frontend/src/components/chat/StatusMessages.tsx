import * as React from 'react';
import styled from 'styled-components';
import { RecordingState } from '../../controllers/chat';

interface MessageContainerProps {
    red: boolean;
}

//TODO: add blinking red text
const MessagesContainer = styled.div<MessageContainerProps>`
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: blue;
    ${({ red }) =>
        red &&
        `font-weight: bold;
        color: red;`}
`;

interface Props {
    hasRecording: boolean;
    recordingState: RecordingState;
}

export const StatusMessages: React.FunctionComponent<Props> = ({
    hasRecording,
    recordingState,
}) => {
    const getStatusMessage = (
        hasRecording: boolean,
        status: RecordingState
    ): string => {
        if (hasRecording) {
            return 'Við bíðum eftir að vinur þinn sendi upptökuna. Vinsamlegast ekki loka glugganum.';
        } else {
            switch (status) {
                case (status = RecordingState.NOT_RECORDING):
                    return 'Við bíðum eftir að vinur þinn byrji upptökuna.';
                case (status = RecordingState.RECORDING):
                    return 'Upptaka í gangi, vinsamlegast ekki loka glugganum.';
                case (status = RecordingState.RECORDING_REQUESTED):
                    return 'Upptakan er að hefjast.';
                default:
                    return '';
            }
        }
    };

    const statusMessage = getStatusMessage(hasRecording, recordingState);

    return (
        <MessagesContainer
            red={hasRecording || recordingState === RecordingState.RECORDING}
        >
            {statusMessage}
        </MessagesContainer>
    );
};

export default StatusMessages;
