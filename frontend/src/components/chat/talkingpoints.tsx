import * as React from 'react';
import styled from 'styled-components';

import Chat, { RecordingState } from '../../controllers/chat';
import { AudioInfo } from '../../types/audio';
import TextInput from '../ui/input/text-input';

import { talkingpoints } from '../../constants/talkingpoints';

const TalkingPointContainer = styled.div`
    width: 100%;
    margin: 8rem auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5rem;
`;

const TalkingPointInput = styled(TextInput)`
    grid-column: 1 / 3;

    @media (max-width: 1024px) {
        grid-column: 1;
    }
`;

interface Props {
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

    displayTalkingPoint = (seconds: number): Array<String> => {
        // TODO: make the talking points random so that not everyone talks
        // about the same things in the same order, also need a longer list so
        // might want to put them in the database
        // also don't want to reuse talking points so will need to keep a list
        // of talking points which have already been used
        // make sure the same one
        // doesn't come up twice in a row
        // TODO: replace the share link with the talking points

        // TODO: change from 15 to 2 mins(120) after the demo
        const intervalLength = 15;
        // Make sure to stick with the same talking point throughout the interval
        // Get the NextTalkingPoint with
        // Math.floor(seconds/talkingpoints.length)
        // ex:  121seconds/5talkingpoints = floor(24.20) = 24
        // Make sure to always stay within the length of the talking points
        // by looping through them when you've reached the last talking point
        // with NextTalkingPoint % talkingpoints.length
        // ex: 24thtalkingpoint % 5talkingpoints = 4th talking point
        let talkingNumber = Math.floor(seconds / talkingpoints.length) % talkingpoints.length;
        if (seconds > intervalLength) {
            console.log(talkingNumber);
            return ["Vantar þér eitthvað til að spjalla um?", talkingpoints[talkingNumber]];
        }
        return ["", ""];
    }

    render() {
        const { seconds } = this.state;
        const talkingpoint  = this.displayTalkingPoint(seconds);
        const display = talkingpoint[0] ? true : false;

        return (
            <TalkingPointContainer>
            { display && (
                <TalkingPointInput
                    label={ talkingpoint[0] }
                    value={ talkingpoint[1] }
                />
            )}
            </TalkingPointContainer>
        );
    }
}
