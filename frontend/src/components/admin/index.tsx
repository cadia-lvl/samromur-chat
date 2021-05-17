import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import Switch from 'react-switch';

import Layout from '../ui/layout';
import Session from './session';

import * as api from '../../services/api';
import { SessionMetadata } from '../../types/sessions';
import { references } from '../../constants/demographics';
import { Stats } from './stats';
import { getHumanReadableTime, splitSeconds } from '../../utilities/utils';

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

const LeaderBoardContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    align-items: left;
`;

const LeaderBoardItem = styled.div`
    width: 100%;
`;

interface BarProps {
    percents: number;
}

const LeaderBoardBar = styled.div<BarProps>`
    width: ${({ percents }) => percents}%;
    height: 3rem;
    background-color: #60c197;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const SessionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1.5rem;
`;

interface Reference {
    person: string;
    collected: number;
}

type Props = RouteComponentProps;
interface State {
    sessions: SessionMetadata[];
    leaderBoard: Reference[];
    showPartial: boolean;
}

class AdminPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sessions: [],
            leaderBoard: [],
            showPartial: true,
        };
        this.handlePartialToggleChange = this.handlePartialToggleChange.bind(
            this
        );
    }

    getInitialLeaderBoard = (): Reference[] => {
        const l: Reference[] = [];
        for (const reference of references) {
            l.push({ person: reference.id, collected: 0 });
        }
        return l;
    };

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
        this.handleLeaderBoardChange(sessions, showPartial);
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
        this.handleLeaderBoardChange(this.state.sessions, showPartial);
    };

    /**
     * Update leaderBoard
     */
    handleLeaderBoardChange = (sessions, showPartial) => {
        const leaderBoard = this.calculateLeaderBoard(sessions, showPartial);
        this.setState({ leaderBoard });
    };

    calculateLeaderBoard = (
        sessions: SessionMetadata[],
        showPartial
    ): Reference[] => {
        const leaderBoard = this.getInitialLeaderBoard();
        for (const session of sessions) {
            const { client_a, client_b } = session;

            for (const ref of leaderBoard) {
                if (
                    client_a &&
                    ref.person === client_a.reference &&
                    client_a.duration_seconds &&
                    (showPartial ? true : client_b && client_b.duration_seconds)
                ) {
                    ref.collected += client_a.duration_seconds;
                    break;
                } else if (
                    client_b &&
                    ref.person === client_b.reference &&
                    showPartial
                ) {
                    ref.collected += client_b.duration_seconds;
                    break;
                }
            }
        }

        // Order by total duration seconds

        const sortedLeaderBoard = leaderBoard.sort((a, b) => {
            if (a.collected > b.collected) {
                return -1;
            }
            if (a.collected < b.collected) {
                return 1;
            }
            return 0;
        });

        console.log(sortedLeaderBoard);
        return sortedLeaderBoard;
    };

    render() {
        const { sessions, leaderBoard, showPartial } = this.state;
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
                    <LeaderBoardContainer>
                        {leaderBoard.map((ref: Reference, i: number) => {
                            return (
                                <LeaderBoardItem key={i}>
                                    {`${ref.person}`}
                                    <LeaderBoardBar
                                        percents={
                                            (ref.collected * 100) /
                                            leaderBoard[0].collected
                                        }
                                    >
                                        {getHumanReadableTime(
                                            splitSeconds(ref.collected)
                                        )}
                                    </LeaderBoardBar>
                                </LeaderBoardItem>
                            );
                        })}
                    </LeaderBoardContainer>
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
