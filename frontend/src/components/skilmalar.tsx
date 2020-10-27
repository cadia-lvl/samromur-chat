import * as React from 'react';
import styled from 'styled-components';
import {
    withRouter,
    RouteComponentProps
} from "react-router-dom";

import Layout from './ui/layout';

import { terms } from '../constants/documents-isl';

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
`;

type Props = RouteComponentProps;

interface State {
    userUrl: string;
}

class Terms extends React.Component<Props, State> {
    DisplayDocument() {
        return terms.map((article) => <p>{article}</p>);
    }

    render() {
        return (
            <Layout>
                <TextContainer>
                   {this.DisplayDocument() }
                </TextContainer>
            </Layout>
        );
    }
}

export default withRouter(Terms);
