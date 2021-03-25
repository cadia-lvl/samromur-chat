import styled from 'styled-components';

const Icon = styled.svg.attrs({
    version: '1.1',
    xmlns: 'http://www.w3.org/2000/svg',
    xmlnsXlink: 'http://www.w3.org/1999/xlink',
})``;

export interface IconProps {
    height?: number;
    width?: number;
    small?: boolean;
    medium?: boolean;
    large?: boolean;
    fill?: string;
    hoverFill?: string;
    outline?: string;
    type?: string;
}

// To-do: large to medium and medium to small etc on small screens
/* eslint-disable no-extra-boolean-cast */
export default styled(Icon)<IconProps>`
    height: ${({ height }) => (height ? height : '20px')};
    width: ${({ width }) => (width ? width : '20px')};
    fill: ${({ fill }) => (!!fill ? fill : 'gray')};
`;
/* eslint-enable no-extra-boolean-cast */
