import * as React from 'react';
import styled from 'styled-components';

const LayoutContainer = styled.div`
    width: 100vw;
    height: 100vh;
    //background-color: #f9f9f9;
`;

const Padding = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
`;

const Header = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled.h1`
    font-weight: 600;
    & span {
        font-weight: 800;
    }
`;

const StyledLink = styled.a`
    text-decoration: none;
    :visited {
        color: black;
    }
`;

interface Props {
    children?: React.ReactNode;
}

export const Layout: React.FunctionComponent<Props> = ({ children }) => {
    return (
        <LayoutContainer>
            <Padding>
                <Header>
                    <Title>
                        <StyledLink href="/">
                            Samrómur <span>spjall</span>
                        </StyledLink>
                    </Title>
                </Header>
                {children}
            </Padding>
        </LayoutContainer>
    );
};

export default Layout;
