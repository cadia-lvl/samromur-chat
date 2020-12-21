import * as React from 'react';
import styled from 'styled-components';

import { RecordingState } from '../../controllers/chat';
import { AudioInfo } from '../../types/audio';
import TextInput from '../ui/input/text-input';

import { talkingpoints } from '../../constants/talkingpoints';
import { shuffleArray } from '../../utilities/utils';

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
    recordingState: RecordingState;
}

interface State {
    seconds: number;
}

export default class TalkingPoint extends React.Component<Props, State> {
    private interval: any;
    private maxSeconds: number;
    private minSeconds: number;
    private talkingPoints: Array<string>;

    constructor(props: Props) {
        super(props);

        this.state = {
            seconds: 0,
        };
        this.maxSeconds = 2100;
        this.minSeconds = 600;
        this.talkingPoints = talkingpoints;
        shuffleArray(this.talkingPoints);
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

    displayTalkingPoint = (seconds: number): Array<string> => {
        // TODO: Add a longer list of talking points
        // might want to put them in the database
        // TODO: replace the share link with the talking points

        const intervalLength = 120;
        // Make sure to stick with the same talking point throughout the interval
        // Get the NextTalkingPoint with
        // Math.floor(seconds/intervalLength)
        // ex:  121seconds/5intervalLength = floor(24.20) = 24
        // Make sure to always stay within the length of the talking points
        // by looping through them when you've reached the last talking point
        // with NextTalkingPoint % talkingpoints.length
        // ex: 24thtalkingpoint % 5talkingpoints = 4th talking point
        if (seconds > 0) {
            const talkingNumber =
                Math.floor(seconds / intervalLength) %
                this.talkingPoints.length;
            return [
                'Vantar þig eitthvað til að spjalla um?',
                this.talkingPoints[talkingNumber],
            ];
        }
        return ['', ''];
    };

    render() {
        const { seconds } = this.state;
        const talkingpoint = this.displayTalkingPoint(seconds);
        const display = talkingpoint[0] ? true : false;

        return (
            <TalkingPointContainer>
                {display && (
                    <TalkingPointInput
                        label={talkingpoint[0]}
                        value={talkingpoint[1]}
                        readOnly
                    />
                )}
            </TalkingPointContainer>
        );
    }
}
