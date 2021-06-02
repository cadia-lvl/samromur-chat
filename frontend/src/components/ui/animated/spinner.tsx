import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
`;

interface SpinnerProps {
    width?: string;
    height?: string;
}

export const LoadingSpinning = styled.div<SpinnerProps>`
    width: ${({ width }) => (width ? width : '1rem')};
    height: ${({ height }) => (height ? height : '1rem')};
    content: '';
    border: solid thick lightgray;
    border-radius: 50%;
    border-bottom-color: #60c197;
    animation: 1.5s linear infinite ${spin};
`;
