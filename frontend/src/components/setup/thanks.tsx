import * as React from 'react';
import styled from 'styled-components';

import { withRouter, RouteComponentProps } from 'react-router-dom';

import Layout from '../ui/layout';

const ThanksContainer = styled.div`
    width: 100%;
    max-width: 40rem;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Button = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem 2rem;
    cursor: pointer;
    font-size: 1.8rem;
    font-weight: 600;
    background-color: #60c197;
    color: white;

    :active {
        transform: translateY(2px);
    }
`;

interface State {}

type Props = RouteComponentProps;

class Thanks extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    handleClick = () => {
        const { history } = this.props;
        history.push('/');
    };

    render() {
        return (
            <Layout>
                <ThanksContainer>
                    <h2>Takk fyrir að taka þátt</h2>
                    <Button onClick={this.handleClick}>Aftur á forsíðu</Button>
                </ThanksContainer>
            </Layout>
        );
    }
}

export default withRouter(Thanks);
