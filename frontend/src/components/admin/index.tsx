import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Layout from '../ui/layout';
import Session from './session';

import * as api from '../../services/api';
import { SessionMetadata } from '../../types/sessions';

const AdminPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
`;

const SessionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1.5rem;
`;

type Props = RouteComponentProps;

interface State {
    sessions: SessionMetadata[];
}

class AdminPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sessions: [],
        };
    }

    componentDidMount = async () => {
        const sessions = await api.getSessions();
        this.setState({ sessions });
    };

    render() {
        const { sessions } = this.state;
        return (
            <Layout>
                <AdminPageContainer>
                    <SessionsContainer>
                        {sessions.map((session: SessionMetadata, i: number) => {
                            return <Session key={i} session={session} />;
                        })}
                    </SessionsContainer>
                </AdminPageContainer>
            </Layout>
        );
    }
}

export default withRouter(AdminPage);
