import * as React from 'react';
import styled from 'styled-components';
import {
    withRouter,
    RouteComponentProps
} from "react-router-dom";

import TextInput from '../ui/input/text-input';
import Layout from '../ui/layout';
import UnsupportedBrowser from '../ui/unsupported-browser';
import { isChromium } from '../../utilities/utils';

const FrontPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
`;

const SubmitButton = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #60C197;
    color: white;
    cursor:pointer;
    font-size: 2rem;

    :active {
        transform: translateY(2px);
    }

    & > * {
        padding: 0.5rem 1rem;
    }
`;

const JoinContainer = styled.div`
    width: 100%;
    display: flex;
    gap: 1rem;
`;


const UrlInput = styled(TextInput)`

`;

type Props = RouteComponentProps;

interface State {
    userUrl: string;
}

class FrontPage extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        // autogenerate a chatroom name from the timestamp
        this.state = {
            userUrl: (+new Date()).toString(30),
        }
    }

    onUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const userUrl = e.currentTarget.value;
        this.setState({ userUrl });
    }

    handleJoin = () => {
        const { history } = this.props;
        const { userUrl } = this.state;
        history.push(`/${userUrl}`);
    }

    render() {
        if (isChromium()) {
            return (
                <Layout>
                    <FrontPageContainer>
                        <JoinContainer>
                            <UrlInput
                                label={'Opna spjall'}
                                value={this.state.userUrl}
                                placeholder={'Spjallkóði'}
                                onChange={this.onUrlChange}
                            />
                            <SubmitButton onClick={this.handleJoin}>
                                <span>Opna</span>
                            </SubmitButton>
                        </JoinContainer>

                    </FrontPageContainer>
                </Layout>
            );
        } else {
            return (
                <Layout>
                    <UnsupportedBrowser />
                </Layout>
            )
        }
    }
}

export default withRouter(FrontPage);
