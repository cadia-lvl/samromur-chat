import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Layout from '../ui/layout';
import Board from './barlist';
import * as api from '../../services/api';
import { SessionMetadata } from '../../types/sessions';
import { students } from '../../constants/demographics';

const LeaderBoardPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
`;

type Props = RouteComponentProps;
interface State {
    sessions: SessionMetadata[];
    partial: boolean;
}

class LeaderBoard extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            sessions: [],
            partial: true,
        };
    }

    componentDidMount = async () => {
        const sessions = await api.getSessions(this.state.partial);
        this.setState({ sessions });
    };

    render() {
        return (
            <Layout>
                <LeaderBoardPageContainer>
                    <Board
                        sessions={this.state.sessions}
                        participants={students}
                        partial={this.state.partial}
                    />
                </LeaderBoardPageContainer>
            </Layout>
        );
    }
}

export default withRouter(LeaderBoard);
