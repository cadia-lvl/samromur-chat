import * as React from 'react';
import styled from 'styled-components';

interface Props {
    name: string;
    value: string | number;
}

const Title = styled.div`
    font-size: 1rem;
    color: gray;
`;

const Value = styled.div`
    font-size: 1.5rem;
`;

export const Stat: React.FunctionComponent<Props> = (props) => {
    return (
        <div>
            <Title>{props.name}</Title>
            <Value>{props.value}</Value>
        </div>
    );
};
