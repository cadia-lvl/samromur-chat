import * as React from 'react';
import styled from 'styled-components';
import { RecordingState } from '../../controllers/chat';

interface MessageContainerProps {
    hasRecording: boolean;
}

//TODO: add blinking red text
const MessagesContainer = styled.div<MessageContainerProps>`
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    color: blue;
    ${({ hasRecording }) =>
        hasRecording
            ? `
            font-weight: bold;
            color: red;
            text-decoration: blink;
            `
            : ``}
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
        // TODO: Translate to icelandic
        if (hasRecording) {
            return 'Bið eftir að vinur þinn sendi upptökuna.';
        } else {
            switch (status) {
                case (status = RecordingState.NOT_RECORDING):
                    return 'Bið eftir að vinur þinn byrji upptökuna.';
                case (status = RecordingState.RECORDING):
                    return 'Upptaka í gangi, vinsamlegast ekki loka vafraflipanum / glugganum.';
                case (status = RecordingState.RECORDING_REQUESTED):
                    return 'Upptakan er að hefjast.';
                default:
                    '';
            }
        }
    };

    const statusMessage = getStatusMessage(hasRecording, recordingState);

    return (
        <MessagesContainer hasRecording={hasRecording}>
            {statusMessage}
        </MessagesContainer>
    );
};

export default StatusMessages;
