import * as React from 'react';
import styled from 'styled-components';

import Chat, { RecordingState } from '../../controllers/chat';
import { AudioInfo } from '../../types/audio';
import { splitSeconds } from '../../utilities/utils';

import Swipe from '../ui/animated/swipe';
import ProgressBar from './progress-bar';

const RecordingsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
`;

const StopwatchContainer = styled.div`
    border-radius: 0.5rem;
    padding: 0 0.5rem;
    width: 9rem;
    max-width: 100%;
    font-size: 3rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    & > * {
        justify-self: center;
        align-self: center;
    }

    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
`;

const Audio = styled.audio`
    width: 100%;
    & :active,
    :focus {
        outline: none;
    }
`;

const SwipeSwap = styled(Swipe)`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
`;

interface Props {
    chat: Chat;
    recording: AudioInfo;
    recordingState: RecordingState;
}

interface State {
    seconds: number;
}

export default class Recording extends React.Component<Props, State> {
    private interval: any;
    private maxSeconds: number;
    private minSeconds: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            seconds: 0,
        };
        this.maxSeconds = 2100;
        this.minSeconds = 600;
    }

    componentDidUpdate = (prevProps: Props) => {
        const { recording, recordingState } = this.props;
        const oldState = prevProps.recordingState;
        if (oldState !== recordingState) {
            if (recordingState === RecordingState.RECORDING) {
                this.startStopwatch();
            } else if (recordingState === RecordingState.NOT_RECORDING) {
                this.stopStopwatch();
            }
        }

        if (prevProps.recording && !recording) {
            this.setState({ seconds: 0 });
        }
    };

    startStopwatch = () => {
        this.interval = setInterval(() => {
            this.setState({ seconds: this.state.seconds + 1 });
        }, 1000);
    };

    stopStopwatch = () => {
        clearInterval(this.interval);
    };

    render() {
        const { recording } = this.props;
        const { seconds } = this.state;
        const { m1, m2, s1, s2 } = splitSeconds(seconds);

        return (
            <RecordingsContainer>
                <StopwatchContainer>
                    <span>{m1}</span>
                    <span>{m2}</span>
                    <span>:</span>
                    <span>{s1}</span>
                    <span>{s2}</span>
                </StopwatchContainer>
                <SwipeSwap second={!!recording}>
                    <ProgressBar
                        min={this.minSeconds}
                        max={this.maxSeconds}
                        val={seconds}
                    />
                    <Audio controls src={!!recording ? recording.url : ''} />
                </SwipeSwap>
            </RecordingsContainer>
        );
    }
}
