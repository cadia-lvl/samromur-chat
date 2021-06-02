import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import Switch from 'react-switch';

import Layout from '../ui/layout';
import Board from '../leaderboard/barlist';
import Session from './session';

import * as api from '../../services/api';
import { SessionMetadata } from '../../types/sessions';
import { references } from '../../constants/demographics';
import { Stats } from './stats';

const AdminPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
`;

const SwitchContainer = styled.label`
    display: flex;
    align-items: center;
    gap: 1rem;
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
    showPartial: boolean;
}

class AdminPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sessions: [],
            showPartial: true,
        };
        this.handlePartialToggleChange = this.handlePartialToggleChange.bind(
            this
        );
    }

    componentDidMount = async () => {
        // Show partial recordings if partial=true is in the url
        const URLPartial = new URLSearchParams(window.location.search).get(
            'partial'
        );
        const showPartial =
            URLPartial !== null && URLPartial === 'true' ? true : false;
        // Always fetch the partial recordings because it's one less network
        // call and easier to show them once we have them
        const sessions = await api.getSessions(this.state.showPartial);
        this.handlePartialToggleChange(showPartial);
        this.setState({ sessions });
    };

    /**
     * Indicate whether partial recordings are shown
     */
    handlePartialToggleChange = (showPartial: boolean) => {
        const updatedURL =
            '//' +
            window.location.host +
            window.location.pathname +
            '?partial=' +
            showPartial;
        this.setState({ showPartial });
        window.history.pushState(null, 'Spjall - mamma', updatedURL);
    };

    render() {
        const { sessions, showPartial } = this.state;
        return (
            <Layout>
                <AdminPageContainer>
                    <SwitchContainer>
                        <span>Ófullkomin samtöl </span>
                        <Switch
                            onChange={this.handlePartialToggleChange}
                            checked={showPartial}
                        />
                    </SwitchContainer>
                    <Stats sessions={sessions} partial={showPartial} />
                    <Board
                        sessions={sessions}
                        participants={references}
                        partial={showPartial}
                    />
                    <SessionsContainer>
                        {sessions.map((session: SessionMetadata, i: number) => {
                            return (
                                <Session
                                    key={i}
                                    session={session}
                                    showPartial={showPartial}
                                />
                            );
                        })}
                    </SessionsContainer>
                </AdminPageContainer>
            </Layout>
        );
    }
}

export default withRouter(AdminPage);
