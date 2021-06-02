import * as React from 'react';
import styled from 'styled-components';

import { SessionMetadata } from '../../types/sessions';
import { getHumanReadableTime, splitSeconds } from '../../utilities/utils';

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

interface Reference {
    id: string;
    name: string;
    collected: number;
}

interface Props {
    sessions: SessionMetadata[];
    participants: any;
    partial: boolean;
}

export default class Board extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    getInitialLeaderBoard = (): Reference[] => {
        const l: Reference[] = [];
        for (const reference of this.props.participants) {
            l.push({
                name: reference.name,
                id: reference.id,
                collected: 0,
            });
        }
        return l;
    };

    calculateLeaderBoard = (): Reference[] => {
        const showPartial = this.props.partial;
        const leaderBoard = this.getInitialLeaderBoard();
        for (const session of this.props.sessions) {
            const { client_a, client_b } = session;

            for (const ref of leaderBoard) {
                if (
                    client_a &&
                    ref.id === client_a.reference &&
                    client_a.duration_seconds &&
                    (showPartial ? true : client_b && client_b.duration_seconds)
                ) {
                    ref.collected += client_a.duration_seconds;
                    break;
                } else if (
                    client_b &&
                    ref.id === client_b.reference &&
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
        const leaderBoard = this.calculateLeaderBoard();
        return (
            <LeaderBoardContainer>
                {leaderBoard.map((ref: Reference) => {
                    const percent =
                        (ref.collected * 100) / leaderBoard[0].collected;
                    return (
                        <LeaderBoardItem key={ref.id}>
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
        );
    }
}
