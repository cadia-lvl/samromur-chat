import * as React from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { withRouter, RouteComponentProps } from 'react-router-dom';

import Layout from '../ui/layout';
import Chatroom from '../chat/room';
import DemographicForm from './demographics';
import { UserClient, UserDemographics } from '../../types/user';
import { AudioInfo } from '../../types/audio';
import * as api from '../../services/api';

const SetupContainer = styled.div`
    width: 100%;
    max-width: 40rem;
    display: flex;
    flex-direction: column;

    & > * {
        margin: 0 auto;
    }
`;

interface State {
    demographics?: UserDemographics;
    recording?: AudioInfo;
    uploading: boolean;
    uploaded: boolean;
    uploadError: boolean;
    userClient?: UserClient;
}

type Props = RouteComponentProps;

class Setup extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            demographics: undefined,
            recording: undefined,
            uploading: false,
            uploaded: false,
            uploadError: false,
            userClient: undefined,
        };
    }

    onSubmitDemographics = (age: string, gender: string, username: string) => {
        this.setState({ demographics: { age, gender } });
        const id = uuid();
        const userClient: UserClient = {
            agreed: false,
            id,
            username,
            voice: false,
        };
        this.setState({ userClient });
    };

    onUpload = async (recording: AudioInfo) => {
        const { demographics } = this.state;
        await api.uploadClip(recording, demographics);
        // Push to thanks page
        const { history } = this.props;
        history.push('/takk');
    };

    render() {
        const { demographics, userClient } = this.state;
        const isReady = !(!demographics || !userClient);
        return (
            <Layout>
                <SetupContainer>
                    {!isReady ? (
                        <DemographicForm onSubmit={this.onSubmitDemographics} />
                    ) : (
                        <Chatroom
                            onUpload={this.onUpload}
                            userClient={userClient}
                        />
                    )}
                </SetupContainer>
            </Layout>
        );
    }
}

export default withRouter(Setup);
