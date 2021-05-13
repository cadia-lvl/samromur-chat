import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Layout from '../ui/layout';
import Session from './session';

import * as api from '../../services/api';
import { SessionMetadata } from '../../types/sessions';
import { references } from '../../constants/demographics';

const AdminPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
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
}

class AdminPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sessions: [],
            leaderBoard: [],
        };
    }

    getInitialLeaderBoard = (): Reference[] => {
        const l: Reference[] = [];
        for (const reference of references) {
            l.push({ person: reference.id, collected: 0 });
        }
        return l;
    };

    componentDidMount = async () => {
        const sessions = await api.getSessions();
        const leaderBoard = this.calculateLeaderBoard(sessions);
        this.setState({ sessions });
        this.setState({ leaderBoard });
    };

    calculateLeaderBoard = (sessions: SessionMetadata[]): Reference[] => {
        const leaderBoard = this.getInitialLeaderBoard();
        for (const session of sessions) {
            const { client_a, client_b } = session;

            for (const ref of leaderBoard) {
                if (
                    ref.person === client_a.reference &&
                    client_a.duration_seconds !== null &&
                    client_b.duration_seconds !== null
                ) {
                    ref.collected += client_a.duration_seconds;
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
        const { sessions, leaderBoard } = this.state;
        return (
            <Layout>
                <AdminPageContainer>
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
                                    >{`${(ref.collected / 60).toFixed(
                                        2
                                    )} mín`}</LeaderBoardBar>
                                </LeaderBoardItem>
                            );
                        })}
                    </LeaderBoardContainer>
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
