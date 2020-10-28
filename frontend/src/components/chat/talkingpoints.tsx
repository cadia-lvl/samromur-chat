import * as React from 'react';
import styled from 'styled-components';

import Chat, { RecordingState } from '../../controllers/chat';
import { AudioInfo } from '../../types/audio';

import ProgressBar from './progress-bar';
import { talkingpoints } from '../../constants/talkingpoints';

const TalkingPointContainer = styled.div`
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
`;
const MainButton = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.8rem;
`;

interface Props {
    chat: Chat;
    recording: AudioInfo;
    recordingState: RecordingState,
}

interface State {
    seconds: number;
}

export default class TalkingPoint extends React.Component<Props, State> {
    private interval: any;
    private maxSeconds: number;
    private minSeconds: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            seconds: 0,
        }
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
    }

    startStopwatch = () => {
        this.interval = setInterval(() => {
            this.setState({ seconds: this.state.seconds + 1 });
        }, 1000);
    }

    stopStopwatch = () => {
        clearInterval(this.interval);
    }

    // randomize the talking point that comes up, but make sure the same one
    // doesn't come up twice in a row
    // <ProgressBar min={this.minSeconds} max={this.maxSeconds} val={seconds} />
    render() {
        const { recording } = this.props;
        const { seconds } = this.state;

        return (
            <TalkingPointContainer>
                <MainButton>
                    <p>{ talkingpoints[0] }</p>
                </MainButton>
            </TalkingPointContainer>
        );
    }
}
