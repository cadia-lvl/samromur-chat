import * as React from 'react';
import styled from 'styled-components';

import Chat, { RecordingState } from '../../controllers/chat';
import { AudioInfo } from '../../types/audio';
import { getTimestampString, splitSeconds } from '../../utilities/utils';

import Swipe from '../ui/animated/swipe';
import ProgressBar from './progress-bar';

import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

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
    grid-template-columns: repeat(1, 1fr);
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
        const timestampString = getTimestampString(splitSeconds(seconds));

        return (
            <RecordingsContainer>
                <StopwatchContainer>
                    <span>{timestampString}</span>
                </StopwatchContainer>
                <SwipeSwap second={!!recording}>
                    <ProgressBar
                        min={this.minSeconds}
                        max={this.maxSeconds}
                        val={seconds}
                    />
                    <AudioPlayer
                        autoPlayAfterSrcChange={false}
                        customAdditionalControls={[]}
                        customControlsSection={[
                            RHAP_UI.MAIN_CONTROLS,
                            RHAP_UI.VOLUME_CONTROLS,
                        ]}
                        layout={'horizontal'}
                        showJumpControls={false}
                        volume={0.5}
                        src={!!recording ? recording.url : ''} // eslint-disable-line no-extra-boolean-cast
                    />
                </SwipeSwap>
            </RecordingsContainer>
        );
    }
}
