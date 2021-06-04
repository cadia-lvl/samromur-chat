import * as React from 'react';
import styled from 'styled-components';

import Chat, { RecordingState, VoiceState } from '../../controllers/chat';
import { AudioInfo } from '../../types/audio';
import { LoadingSpinning } from '../ui/animated/spinner';
import Swipe from '../ui/animated/swipe';
import HeadSet from '../ui/icons/headset';
import HeadSetMuted from '../ui/icons/headset-muted';

const ControlsContainer = styled(Swipe)`
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 3rem;
`;

const MainButtonContainer = styled.div<{ isActive: boolean }>`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.8rem;

    :active {
        transform: translateY(2px);
    }

    ${({ isActive }) =>
        isActive &&
        `
        & > div {
            opacity: 1;
        }
    `}

    & :hover {
        & > div {
            opacity: 1;
        }
    }
`;

const MainButton = styled.button`
    position: relative;
    width: 5rem;
    height: 5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: white;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    outline: none;

    &:focus-visible {
        border: 2px solid black;
    }
`;

const Glow = styled.div<{ red?: boolean }>`
    position: absolute;
    width: 6.2rem;
    height: 6.2rem;
    opacity: 0.2;
    background: linear-gradient(
        to left,
        ${({ red }) => (red ? '#FF99A1, #FF4F5E' : '#6062C1, #A7BFDD')}
    );
    border-radius: 50%;
    filter: blur(6px);
    transition: opacity 0.2s linear;
`;

const RecordIcon = styled.div<{ active?: boolean }>`
    border-radius: ${({ active }) => (active ? '0%' : '50%')};
    transform: scale(${({ active }) => (active ? 0.9 : 1)});
    transition: border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background-color: #ff4f5e;
    height: 35px;
    width: 35px;
    box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.08);
    -moz-box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.08);
    -webkit-box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.08);
`;

const SubmitButtons = styled(Swipe)`
    width: 100%;
`;

const SubmitButtonsContainer = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
`;

const SpinnerContainer = styled.div`
    width: 100%;
    display: grid;
    justify-content: center;
`;

interface ButtonProps {
    green?: boolean;
    red?: boolean;
}
export const Button = styled.button<ButtonProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    background-color: ${({ green, red }) =>
        green ? '#60C197' : red ? '#ff4f5e' : '#0099ff'};
    color: white;
    font-size 1.2rem;
    font-weight: 600;
    cursor: pointer;
    padding: 1rem;

    :active {
        transform: translateY(2px);
    }
`;

interface Props {
    chat: Chat;
    onRemove: () => void;
    onSubmit: () => void;
    recording: AudioInfo;
    recordingState: RecordingState;
    voiceState: VoiceState;
    chatRoomOwner: boolean;
    createToast: (message: string) => void;
}

interface State {
    confirm: boolean;
    submitted: boolean;
}

export default class Controls extends React.Component<Props, State> {
    private interval: number;
    constructor(props: Props) {
        super(props);

        this.state = {
            confirm: false,
            submitted: false,
        };
    }

    handleVoice = () => {
        const { chat, voiceState } = this.props;
        if (!chat) {
            return;
        }
        if (voiceState === VoiceState.VOICE_CONNECTED) {
            chat.mute();
        } else {
            chat.unMute().catch(() => {
                this.props.createToast('Hljóðnemi finnst ekki');
            });
        }
    };

    handleRecord = () => {
        const { chat, recordingState } = this.props;
        if (!chat) {
            return;
        }
        if (recordingState === RecordingState.RECORDING_REQUESTED) {
            chat.cancelRecording();
        } else if (recordingState === RecordingState.RECORDING) {
            chat.stopRecording();
        } else {
            chat.requestRecording();
        }
    };

    handleConfirm = () => {
        this.setState({ confirm: !this.state.confirm });
    };

    handleRemove = () => {
        this.props.onRemove();
        this.setState({ confirm: false });
    };

    handleOnSubmit = () => {
        this.setState({ submitted: true });
        this.props.onSubmit();
    };

    render() {
        const {
            recording,
            recordingState,
            voiceState,
            chatRoomOwner,
        } = this.props;

        const { confirm, submitted } = this.state;

        return (
            <ControlsContainer second={!!recording}>
                <ButtonsContainer>
                    <MainButtonContainer
                        isActive={voiceState === VoiceState.VOICE_CONNECTED}
                        onClick={this.handleVoice}
                    >
                        <Glow />
                        {voiceState === VoiceState.VOICE_CONNECTED ? (
                            <MainButton title="Slökktu á hljóði">
                                <HeadSet height={40} width={40} />
                            </MainButton>
                        ) : (
                            <MainButton title="Kveiktu á hljóði">
                                <HeadSetMuted height={40} width={40} />
                            </MainButton>
                        )}
                    </MainButtonContainer>
                    {chatRoomOwner && (
                        <MainButtonContainer
                            isActive={
                                recordingState === RecordingState.RECORDING
                            }
                            onClick={this.handleRecord}
                        >
                            <Glow red />
                            <MainButton
                                title={
                                    recordingState !== RecordingState.RECORDING
                                        ? 'Smelltu hér til byrja að taka upp'
                                        : 'Smelltu hér til að stöðva upptökuna'
                                }
                            >
                                <RecordIcon
                                    active={
                                        recordingState ===
                                        RecordingState.RECORDING
                                    }
                                />
                            </MainButton>
                        </MainButtonContainer>
                    )}
                </ButtonsContainer>
                {chatRoomOwner && (
                    <SubmitButtons second={confirm || submitted}>
                        <SubmitButtonsContainer>
                            <Button onClick={this.handleConfirm}>
                                Byrja aftur
                            </Button>
                            <Button onClick={this.handleOnSubmit} green>
                                Senda inn
                            </Button>
                        </SubmitButtonsContainer>
                        {submitted ? (
                            <SpinnerContainer>
                                <LoadingSpinning
                                    height={'3rem'}
                                    width={'3rem'}
                                />
                            </SpinnerContainer>
                        ) : (
                            <SubmitButtonsContainer>
                                <Button onClick={this.handleConfirm}>
                                    Til baka
                                </Button>
                                <Button red onClick={this.handleRemove}>
                                    Eyða upptöku
                                </Button>
                            </SubmitButtonsContainer>
                        )}
                    </SubmitButtons>
                )}
            </ControlsContainer>
        );
    }
}
