import * as React from 'react';
import styled from 'styled-components';
import Checkbox from '../ui/input/checkbox';

const AgreeContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 1rem;

    & span {
        font-size: 1.3rem;
    }
`;


interface Props {
    agreed: boolean;
    handleAgree: () => void;
}

export const AgreeRecordingForm: React.FunctionComponent<Props> = ({ agreed, handleAgree }) => (
    <AgreeContainer>
        <span>Ég er klár í að byrja að taka upp</span>
        <Checkbox checked={agreed} onChange={handleAgree} />
    </AgreeContainer>
);

export default AgreeRecordingForm;