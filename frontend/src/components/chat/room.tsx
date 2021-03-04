import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { AudioInfo } from '../../types/audio';
import { UserClient } from '../../types/user';

import Chat, {
    ChatState,
    RecordingState,
    VoiceState,
} from '../../controllers/chat';
import MicIcon from '../ui/icons/mic';
import Controls from './controls';
import Recordings from './recordings';
import TalkingPoints from './talkingpoints';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StatusMessages from './status-messages';

import { RemoveWarningModal } from './remove-warning-modal';

const ChatroomContainer = styled.div`
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
`;

const CounterContainer = styled.div<{ active: boolean }>`
    position: absolute;
    z-index: 10;
    left: 50%;
    margin-left: -6rem;
    top: -5rem;
    opacity: 0.7;
    background-color: black;
    border-radius: 50%;
    height: 12rem;
    width: 12rem;
    color: white;
    font-size: 8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(${({ active }) => (active ? 1 : 0)});
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
`;

const UserList = styled.div`
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    border: 1px solid #cccccc;
`;

const ListItem = styled.div<{ i?: number }>`
    width: 100%;
    display: grid;
    grid-template-columns: auto 3rem;
    background-color: ${({ i }) => (i % 2 === 0 ? '#EBEBEB' : 'white')};

    gap: 1rem;

    & > * {
        padding: 0.5rem;
    }

    & > :not(:first-child) {
        justify-self: center;
    }
`;

const ListHeader = styled(ListItem)`
    background-color: white;
    height: 3rem;
    align-items: center;

    & span {
        color: gray;
    }
`;

const HeaderItem = styled.div`
    display: flex;
    justify-content: space-between;

    & :nth-child(2) {
        & span {
            color: black;
            font-weight: 700;
            margin-left: 0.3rem;
            margin-right: 1rem;
        }
    }
`;

const Audio = styled.audio`
    display: none;
`;

const Indicator = styled.div<{ connected: boolean }>`
    align-self: center;
    height: 0.5rem;
    width: 0.5rem;
    border-radius: 50%;
    background-color: ${({ connected }) => (connected ? '#60C197' : 'gray')};
`;

const ShareButton = styled.div`
    align-self: center;
    background-color: #60c197;
    color: white;
    display: flex;
    justify-content: center;
    user-select: none;
    width: 100%;

    cursor: pointer;

    & span {
        font-weight: 600;
        font-size: 1.2rem;
        padding: 1rem 2rem;
    }

    :active {
        transform: translateY(2px);
    }

    @media (max-width: 1024px) {
        grid-column: 1;
        max-width: 100%;
    }
`;

// Overwrite ToastContainer to use our global styles
const StyledToastContainer = styled(ToastContainer).attrs({
    className: 'toast-container',
    toastClassName: 'toast',
    bodyClassName: 'body',
    progressClassName: 'progress',
})`
    .toast {
        background-color: #60c197;
        color: white;
        text-align: center;
    }

    .Toastify__toast--error {
        background-color: #ff4f5e;
    }
`;

const ErrorContainer = styled.div`
    background-color: #ff4f5e;
    padding: 1rem;
    margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.div`
    font-size: 1.2rem;
    color: white;
    margin: 0 1rem;
`;

interface ChatroomProps {
    onUpload: (recording: AudioInfo) => void;
    userClient: UserClient;
}

interface State {
    chatState: ChatState;
    countdown: number;
    recordingState: RecordingState;
    voiceState: VoiceState;
    clients: UserClient[];
    recording?: AudioInfo;
    isChatroomOwner: boolean;
    showModal: boolean;
    error: string;
}

interface RouteProp {
    roomId: string;
}

type Props = ChatroomProps & RouteComponentProps<RouteProp>;

class Chatroom extends React.Component<Props, State> {
    private audioRef: React.RefObject<HTMLAudioElement>;
    private chat: Chat;
    private interval?: any;
    private timeout?: any;

    constructor(props: Props) {
        super(props);
        const { userClient } = props;
        this.state = {
            chatState: ChatState.DISCONNECTED,
            countdown: 3,
            recordingState: RecordingState.NOT_RECORDING,
            voiceState: VoiceState.VOICE_DISCONNECTED,
            clients: [userClient],
            recording: undefined,
            isChatroomOwner: true,
            showModal: false,
            error: undefined,
        };

        this.audioRef = React.createRef<HTMLAudioElement>();
    }

    componentDidMount = async () => {
        const url = this.constructSocketUrl();
        const { userClient } = this.props;
        this.chat = new Chat(url, userClient);
        this.chat.onClientsChanged = this.handleClientsChanged;
        this.chat.onIsOwnerChanged = this.handleOwnerChagned;
        this.chat.onRecordingStateChanged = this.handleRecordingStateChanged;
        this.chat.onChatStateChanged = this.handleChatStateChanged;
        this.chat.onVoiceStateChanged = (voiceState) =>
            this.setState({ voiceState });
        this.chat.onError = this.handleChatError;

        this.chat.onAudioTrack = (stream: MediaStream) => {
            const { current: audio } = this.audioRef;
            if (audio) {
                audio.srcObject = stream;
            }
        };

        this.chat.onRecordingStopped = (recording: AudioInfo) => {
            this.setState({ recording });
        };

        this.chat.onUpload = this.handleOnUpload;

        this.setState({ isChatroomOwner: this.chat.isOwner() });
        window.addEventListener('beforeunload', this.alertUser);
        this.addPushState();
        window.addEventListener('popstate', this.alertUserBack);
    };

    componentWillUnmount = async () => {
        window.removeEventListener('beforeunload', this.alertUser);
        window.removeEventListener('popstate', this.alertUserBack);
    };

    // Alert user when recording is not sent in
    // when they try to leave the site with new ur or close window/tab
    // We are unable to customize this and most browsers
    // will block any attempts to do so
    alertUser = (e) => {
        const { recording, recordingState } = this.state;
        e.preventDefault();
        if (recording || recordingState === RecordingState.RECORDING) {
            e.returnValue = '';
        }
    };

    // Alert user when recording is not sent in
    // when the use the back button.
    // Prevent user leaving during a recording.
    // Ask user to stay when recoding exists.
    alertUserBack = (e) => {
        const { recording, recordingState } = this.state;
        const { history } = this.props;

        e.preventDefault();

        if (recordingState === RecordingState.RECORDING) {
            this.addPushState();
            alert('Þú ert enn að taka upp!');
            e.returnValue = '';
        } else if (recording) {
            const confirmLeave = window.confirm(
                'Þú ert um það bil að fara án þess að senda upptökuna þína.'
            );
            if (!confirmLeave) {
                this.addPushState();
                e.returnValue = '';
            } else {
                history.replace('/');
            }
        }
    };

    handleClientsChanged = (clients: UserClient[]) => {
        this.setState({ clients });
    };

    handleOwnerChagned = (isChatroomOwner: boolean) => {
        this.setState({ isChatroomOwner });
    };

    addPushState = () => {
        // Push the this state for alert to have a chance to pop up.
        window.history.pushState(
            { name: 'browserBack' },
            'on browser back click',
            window.location.href
        );
    };

    removeRecording = () => {
        this.setState({ recording: undefined });
    };

    isCountingDown = () => this.interval && this.timeout;

    startCountdown = () => {
        if (!this.isCountingDown()) {
            this.interval = setInterval(() => {
                this.setState({
                    countdown:
                        this.state.countdown === 1
                            ? 1
                            : this.state.countdown - 1,
                });
            }, 1000);

            this.timeout = setTimeout(() => {
                this.chat.startRecording();
                this.removeCountdown();
            }, 3000);
        }
    };

    removeCountdown = () => {
        clearInterval(this.interval);
        clearTimeout(this.timeout);
        this.interval = undefined;
        this.timeout = undefined;
        setTimeout(() => this.setState({ countdown: 3 }), 300);
    };

    handleRecordingStateChanged = (recordingState: RecordingState) => {
        this.setState({ recordingState });
        if (recordingState === RecordingState.RECORDING_REQUESTED) {
            this.startCountdown();
            if (this.state.recording) {
                this.setState({ recording: undefined });
            }
        } else {
            this.removeCountdown();
        }
    };

    handleChatStateChanged = (chatState: ChatState) => {
        this.setState({ chatState });
        if (chatState === ChatState.CONNECTED) {
            console.log('Chat is fully initialized');
        }
    };

    constructSocketUrl = (): string => {
        // Get room id
        const {
            match: {
                params: { roomId },
            },
        } = this.props;

        // Build href
        const href =
            window.location.protocol +
            '//' +
            window.location.host +
            '/' +
            roomId;

        // Destructure pathname
        const parts = href.split('/');

        // Insert /ws/
        parts.splice(parts.length - 1, 0, 'ws');
        let url = parts.join('/');

        // For dev server
        if (url.includes('localhost')) {
            url = url.replace('3000', '3030');
        }

        // Socket endpoint
        const endpoint = url.replace('http', 'ws');

        // Get client id
        const {
            userClient: { id },
        } = this.props;

        // Concat client id
        return endpoint.concat(`/${id}`);
    };

    onSubmit = () => {
        const { recording } = this.state;
        const { onUpload } = this.props;
        this.chat.uploadOther();
        onUpload(recording);
        this.chat.disconnect();
    };

    copyToClipBoard = async () => {
        const toastId = 'toast-copied';
        try {
            toast.dismiss(toastId);
            await navigator.clipboard.writeText(window.location.href);
            toast('Tengill afritaður.', {
                draggable: false,
                toastId, // prevent duplicates
            });
        } catch (err) {
            toast.error('Villa hefur komið upp. Afritaðu tengilinn handvirkt', {
                toastId: 'toast-error',
            });
        }
    };

    handleOnUpload = async () => {
        const { recording } = this.state;
        const { onUpload } = this.props;
        if (recording) {
            onUpload(recording);
            this.chat.disconnect();
        }
    };

    showWarningModal = () => {
        this.setState({ showModal: true });
    };

    closeWarningModal = () => {
        this.setState({ showModal: false });
    };

    handleChatError = (message: string) => {
        this.setState({ error: message });
    };

    render() {
        const {
            clients,
            countdown,
            chatState,
            recordingState,
            recording,
            voiceState,
            showModal,
            isChatroomOwner,
            error,
        } = this.state;

        const {
            match: {
                params: { roomId },
            },
        } = this.props;

        return (
            <ChatroomContainer>
                <CounterContainer
                    active={
                        recordingState === RecordingState.RECORDING_REQUESTED
                    }
                >
                    {countdown}
                </CounterContainer>
                {recordingState !== RecordingState.RECORDING && (
                    <ShareButton onClick={this.copyToClipBoard}>
                        <span>
                            Smelltu til að afrita hlekkinn og deildu með vini
                        </span>
                    </ShareButton>
                )}
                <UserList>
                    <ListHeader>
                        <HeaderItem>
                            <span>Viðmælandi</span>
                            <span>
                                Spjallkóði: <span>{roomId}</span>
                            </span>
                        </HeaderItem>
                        <MicIcon height={30} width={30} />
                    </ListHeader>
                    {clients.map((client: UserClient, i: number) => (
                        <ListItem i={i} key={i}>
                            <span>{client.username}</span>
                            <Indicator connected={client.voice} />
                        </ListItem>
                    ))}
                </UserList>
                <Recordings
                    chat={this.chat}
                    recording={recording}
                    recordingState={recordingState}
                />
                {!isChatroomOwner && !error && (
                    <StatusMessages
                        hasRecording={!!recording}
                        recordingState={recordingState}
                    />
                )}
                {error && (
                    <ErrorContainer>
                        <ErrorMessage>
                            Villa kom upp við tengingu. Vinsamlegast farðu aftur
                            á heimasíðuna og reyndu aftur.
                        </ErrorMessage>
                    </ErrorContainer>
                )}
                <Controls
                    chat={this.chat}
                    onRemove={this.showWarningModal}
                    onSubmit={this.onSubmit}
                    recording={recording}
                    recordingState={recordingState}
                    voiceState={voiceState}
                    chatRoomOwner={isChatroomOwner}
                />
                <Audio autoPlay controls ref={this.audioRef} />
                <TalkingPoints
                    recording={recording}
                    recordingState={recordingState}
                />
                <RemoveWarningModal
                    isOpen={showModal}
                    onRemove={this.removeRecording}
                    onClose={this.closeWarningModal}
                    onSubmit={this.onSubmit}
                />
                <StyledToastContainer
                    position="bottom-center"
                    hideProgressBar
                    pauseOnHover={false}
                    transition={Slide}
                />
            </ChatroomContainer>
        );
    }
}

export default withRouter(Chatroom);
