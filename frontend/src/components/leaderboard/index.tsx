import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Layout from '../ui/layout';

import * as api from '../../services/api';
import { SessionMetadata } from '../../types/sessions';
import { students } from '../../constants/demographics';
import { getHumanReadableTime, splitSeconds } from '../../utilities/utils';

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
    min-height: 3rem;
    background-color: #60c197;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
`;

interface Reference {
    id: string;
    name: string;
    collected: number;
}

type Props = RouteComponentProps;
interface State {
    sessions: SessionMetadata[];
    leaderBoard: Reference[];
}

class LeaderBoard extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sessions: [],
            leaderBoard: [],
        };
    }

    componentDidMount = async () => {
        const sessions = await api.getSessions(true);
        this.setState({ sessions });

        const leaderBoard = this.calculateLeaderBoard(sessions);
        this.setState({ leaderBoard });
    };

    getInitialLeaderBoard = (): Reference[] => {
        const l: Reference[] = [];
        for (const student of students) {
            l.push({
                name: student.name,
                id: student.id,
                collected: 0,
            });
        }
        console.log(l);
        return l;
    };

    calculateLeaderBoard = (sessions: SessionMetadata[]): Reference[] => {
        const leaderBoard = this.getInitialLeaderBoard();
        for (const session of sessions) {
            const { client_a, client_b } = session;

            for (const ref of leaderBoard) {
                if (
                    client_a &&
                    ref.id === client_a.reference &&
                    client_a.duration_seconds
                ) {
                    ref.collected += client_a.duration_seconds;
                    break;
                } else if (client_b && ref.id === client_b.reference) {
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
        const { leaderBoard } = this.state;
        return (
            <Layout>
                <AdminPageContainer>
                    <LeaderBoardContainer>
                        {leaderBoard.map((ref: Reference, i: number) => {
                            const percent =
                                (ref.collected * 100) /
                                leaderBoard[0].collected;
                            return (
                                <LeaderBoardItem key={i}>
                                    {`${ref.name}`}
                                    <LeaderBoardBar percents={percent}>
                                        {percent > 15 &&
                                            getHumanReadableTime(
                                                splitSeconds(ref.collected)
                                            )}
                                    </LeaderBoardBar>
                                </LeaderBoardItem>
                            );
                        })}
                    </LeaderBoardContainer>
                </AdminPageContainer>
            </Layout>
        );
    }
}

export default withRouter(LeaderBoard);
