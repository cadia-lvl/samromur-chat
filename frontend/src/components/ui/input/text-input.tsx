import * as React from 'react';
import styled from 'styled-components';

interface InputProps {
    active: boolean;
}

const InputContainer = styled.div<InputProps>`
    width: 100%;
    position: relative;
    display: inline-block;
    border: 2px solid ${({ active }) => (active ? 'black' : '#e2e2e2')};
    & :active,
    :focus {
        outline: none;
    }
`;

const Padding = styled.div`
    padding: 1rem;
`;

const TextInputContainer = styled.input`
    width: 100%;
    height: 100%;
    border: none;
    appearance: textfield;
    -webkit-appearance: textfield;
    -moz-appearance: textfield;

    & :active,
    :focus {
        outline: none;
    }

    font-size: 1.3rem;
    ::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }
`;

const Label = styled.span`
    position: absolute;
    color: gray;
    font-size: 0.8rem;
    top: -0.6rem;
    background-color: white;
    padding: 0 0.3rem;
    margin-left: 0.3rem;
`;

interface TextInputProps {
    className?: string;
    label: string;
    ref?: React.Ref<HTMLDivElement>;
}

interface State {
    active: boolean;
}

type Props = TextInputProps & React.InputHTMLAttributes<HTMLInputElement>;

class TextInput extends React.Component<Props, State> {
    private ref = React.createRef<HTMLInputElement>();
    constructor(props: Props) {
        super(props);

        this.state = {
            active: false,
        };
    }

    componentDidMount = () => {
        this.ref.current?.addEventListener('focusout', this.onFocusOut);
    };

    componentWillUnmount = () => {
        this.ref.current?.removeEventListener('focusout', this.onFocusOut);
    };

    onFocusOut = () => {
        this.setState({ active: false });
    };

    onFocus = () => {
        this.setState({ active: true });
    };

    render() {
        const { className, label } = this.props;

        const { active } = this.state;

        return (
            <InputContainer active={active} className={className}>
                <Label>{label}</Label>
                <Padding>
                    <TextInputContainer
                        ref={this.ref}
                        onFocus={this.onFocus}
                        {...(this.props as React.InputHTMLAttributes<
                            HTMLInputElement
                        >)}
                    />
                </Padding>
            </InputContainer>
        );
    }
}

export default React.forwardRef(
    (props: Props, ref: React.Ref<HTMLDivElement>) => (
        <TextInput {...props} ref={ref as any} />
    )
);
