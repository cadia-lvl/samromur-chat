import * as React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import CheckMarkIcon from '../icons/check-mark';

interface CheckProps {
    active: boolean;
}

const CheckboxContainer = styled.div<CheckProps>`
    height: 2rem;
    width: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0.2rem;
    border: 2px solid ${({ active }) => (active ? 'black' : '#e2e2e2')};

    &:hover {
        border: 2px solid black;
    }

    &:focus {
        outline: none;
        border: 2px solid black;
    }
`;

const CheckboxInput = styled.input.attrs({ type: 'checkbox' })`
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    & :active,
    :focus {
        outline: none;
    }
`;

const CheckMark = styled(CheckMarkIcon)<CheckProps>`
    display: ${({ active }) => (active ? 'initial' : 'none')};
`;

interface Props {
    checked: boolean;
    onChange: () => void;
}

export const Checkbox: React.FunctionComponent<Props> = ({
    checked,
    onChange,
}) => {
    const [focus, setFocus] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        const { current } = inputRef;

        if (current !== null) {
            current.addEventListener('focusin', onFocusIn);
            current.addEventListener('focusout', onFocusOut);

            return () => {
                current.removeEventListener('focusin', onFocusIn);
                current.removeEventListener('focusout', onFocusOut);
            };
        }
    }, []);

    const onFocusIn = () => {
        setFocus(true);
    };

    const onFocusOut = () => {
        setFocus(false);
    };

    return (
        <CheckboxContainer active={focus} onClick={onChange}>
            <CheckboxInput ref={inputRef} />
            <CheckMark active={checked} />
        </CheckboxContainer>
    );
};

export default Checkbox;
