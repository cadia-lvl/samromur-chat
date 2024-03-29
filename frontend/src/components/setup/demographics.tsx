import * as React from 'react';
import styled from 'styled-components';

import { Demographic, StoredDemographics } from '../../types/user';
import { ages, genders, members } from '../../constants/demographics';

import Info from './information';
import DropdownButton from '../ui/input/dropdown';
import Checkbox from '../ui/input/checkbox';
import TextInput from '../ui/input/text-input';
import NewTabLink from './new-tab-link';
import UnsupportedBrowser from '../ui/unsupported-browser';
import { isRecordingSupported } from '../../utilities/utils';
import {
    loadDemographics,
    saveDemographics,
    demographicsInStorage,
} from '../../utilities/local-storage';

const DemographicContainer = styled.form`
    display: grid;
    gap: 1rem;
    width: 40rem;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 1024px) {
        width: 100%;
        grid-template-columns: 1fr;
    }
`;

const UsernameInput = styled(TextInput)`
    grid-column: 1 / 3;

    @media (max-width: 1024px) {
        grid-column: 1;
    }
`;

const Information = styled(Info)`
    grid-column: 1 / 3;

    @media (max-width: 1024px) {
        grid-column: 1;
    }
`;

interface SubmitButtonProps {
    disabled: boolean;
}

const SubmitButton = styled.button<SubmitButtonProps>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid ${({ disabled }) => (disabled ? 'gray' : '#60C197')};

    border-radius: 0.1rem;

    background-color: ${({ disabled }) => (disabled ? 'gray' : '#60C197')};
    color: white;

    cursor: ${({ disabled }) => (disabled ? 'initial' : 'pointer')};
    &:active {
        transform: ${({ disabled }) => `translateY(${disabled ? 0 : 2}px)`};
        outline: none;
    }

    & span {
        font-weight: 600;
        font-size: 1.1rem;
        padding: 1rem 2rem;
    }

    grid-column: 1 / 3;
    width: 100%;
    margin: 0 auto;

    @media (max-width: 1024px) {
        grid-column: 1;
        max-width: 100%;
    }
`;

const AgreeContainer = styled.div`
    display: grid;
    grid-template-columns: 10% auto;
    justify-items: center;
    align-items: center;
    cursor: pointer;
    & span {
        margin-left: 1rem;
    }

    grid-column: 1 / 3;

    @media (max-width: 1024px) {
        grid-column: 1;
        max-width: 100%;
    }
`;

interface Props {
    onSubmit: (
        age: string,
        gender: string,
        username: string,
        reference: string
    ) => void;
}

interface State {
    agreed: boolean;
    age: Demographic;
    gender: Demographic;
    username: string;
    reference: Demographic;
}

export default class DemographicForm extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            agreed: false,
            age: {
                id: '',
                name: '',
            },
            gender: {
                id: '',
                name: '',
            },
            username: '',
            reference: {
                id: '',
                name: '',
            },
        };
    }

    componentDidMount() {
        if (demographicsInStorage()) {
            const user: StoredDemographics = loadDemographics();
            const { username, age, gender, agreed } = user;

            this.setState({
                username,
                age,
                gender,
                agreed,
            });
        }
    }

    handleAgree = () => {
        this.setState({ agreed: !this.state.agreed });
    };

    onUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const username = e.currentTarget.value;
        this.setState({ username });
    };

    onAgeSelect = (value: string) => {
        const age = ages.find(
            (val: Demographic) => val.name === value
        ) as Demographic;

        // Only update if a value was found
        if (age) {
            this.setState({ age });
        }
    };

    onGenderSelect = (value: string) => {
        const gender = genders.find(
            (val: Demographic) => val.name === value
        ) as Demographic;

        // Only update if a value was found
        if (gender) {
            this.setState({ gender });
        }
    };

    /**
     * Updates the state reference to value if found in the list of references
     * @param value the new reference value
     */
    onReferenceSelect = (value: string) => {
        const reference = members.find(
            (val: Demographic) => val.name === value
        ) as Demographic;

        // Only update if a value was found
        if (reference) {
            this.setState({ reference });
        }
    };

    onSubmit = (event) => {
        event.preventDefault();
        const { age, agreed, gender, username, reference } = this.state;
        if (
            !agreed ||
            !age.name ||
            !gender.name ||
            !username ||
            !reference.name
        ) {
            return;
        }
        this.props.onSubmit(age.id, gender.id, username, reference.id);

        saveDemographics({ age, agreed, gender, username });
    };

    render() {
        if (isRecordingSupported()) {
            const { age, agreed, gender, username, reference } = this.state;
            const terms = '/skilmalar';
            const privacypolicy = '/personuvernd';
            return (
                <DemographicContainer onSubmit={this.onSubmit}>
                    <UsernameInput
                        label={'Notendanafn'}
                        onChange={this.onUsernameChange}
                        value={username}
                    />
                    <DropdownButton
                        content={ages.map((age: Demographic) => age.name)}
                        label={'Aldur'}
                        onSelect={this.onAgeSelect}
                        selected={age.name}
                    />
                    <DropdownButton
                        content={genders.map(
                            (gender: Demographic) => gender.name
                        )}
                        label={'Kyn'}
                        onSelect={this.onGenderSelect}
                        selected={gender.name}
                    />
                    <DropdownButton
                        content={members.map(
                            (reference: Demographic) => reference.name
                        )}
                        label={'Tilvísun'}
                        onSelect={this.onReferenceSelect}
                        selected={reference.name}
                    />
                    <Information title={'Hvers vegna skiptir þetta máli?'}>
                        <p>
                            Ofantaldar upplýsingar eru notaðar til að meta
                            hversu lýðfræðilega dreift gagnasafnið er. Því
                            dreifðara og fjölbreyttara sem það er, því betra.
                            Sjá <NewTabLink href={terms}>skilmála</NewTabLink>{' '}
                            og{' '}
                            <NewTabLink href={privacypolicy}>
                                persónuverndaryfirlýsingu
                            </NewTabLink>{' '}
                            verkefnisins.
                        </p>
                    </Information>
                    <AgreeContainer onClick={this.handleAgree}>
                        <Checkbox
                            checked={agreed}
                            onChange={this.handleAgree}
                        />
                        <span>
                            Ég staðfesti að hafa kynnt mér{' '}
                            <NewTabLink href={terms}>skilmála</NewTabLink> og{' '}
                            <NewTabLink href={privacypolicy}>
                                persónuverndaryfirlýsingu
                            </NewTabLink>{' '}
                            verkefnisins.
                        </span>
                    </AgreeContainer>
                    <SubmitButton
                        disabled={
                            !agreed || !age.name || !gender.name || !username
                        }
                    >
                        <span>Áfram</span>
                    </SubmitButton>
                </DemographicContainer>
            );
        } else {
            return <UnsupportedBrowser />;
        }
    }
}
