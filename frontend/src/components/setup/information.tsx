import * as React from 'react';
import styled from 'styled-components';

import DropdownArrowIcon from '../ui/icons/dropdown-arrow';
import ShowMore from '../ui/animated/show-more';

const InformationContainer = styled.div`
    width: 100%;
    border-left: 2px solid #0099ff;
`;

const TitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: baseline;
    cursor: pointer;
    padding-left: 1rem;
    & > * {
        margin: 0;
        color: #0099ff;
    }
`;

interface ReadMoreProps {
    active: boolean;
}

const ReadMoreContainer = styled(ShowMore)<ReadMoreProps>`
    & > * {
        padding-left: 1rem;
        margin: 0;
        margin-top: 0.5rem;
    }
`;

const Arrow = styled(DropdownArrowIcon)<ReadMoreProps>`
    margin-left: 1rem;
    transform-origin: bottom-right;
    transform: rotate(${({ active }) => (active ? '180deg' : '0deg')});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

interface Props {
    children?: React.ReactNode;
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
    title: string;
}

export const Information: React.FC<Props> = ({
    children,
    className,
    ref,
    title,
}) => {
    const [readMore, setReadMore] = React.useState(false);

    const handleClick = () => {
        setReadMore(!readMore);
    };
    return (
        <InformationContainer className={className} ref={ref}>
            <TitleContainer onClick={handleClick}>
                <h5>{title}</h5>
                <Arrow
                    height={15}
                    width={15}
                    active={readMore}
                    fill={'#0099ff'}
                />
            </TitleContainer>
            <ReadMoreContainer active={readMore}>{children}</ReadMoreContainer>
        </InformationContainer>
    );
};

export default React.forwardRef(
    (props: Props, ref: React.Ref<HTMLDivElement>) => (
        <Information {...props} ref={ref as any} />
    )
);
