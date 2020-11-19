import * as React from 'react';
import styled from 'styled-components';

import { Demographic } from '../../types/user';
import { ages, genders } from '../../constants/demographics';

import Info from './information';
import DropdownButton from '../ui/input/dropdown';
import Checkbox from '../ui/input/checkbox';
import TextInput from '../ui/input/text-input';
import NewTabLink from './new-tab-link';

const DemographicContainer = styled.div`
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

const SubmitButton = styled.div<SubmitButtonProps>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    border-radius: 0.1rem;
    
    background-color: ${({ disabled }) => disabled ? 'gray' : '#60C197'};
    color: white;

    cursor: ${({ disabled }) => disabled ? 'initial' : 'pointer'};
    & :active {
        transform: ${({ disabled }) => `translateY(${disabled ? 0 : 2}px)`};
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
    onSubmit: (age: string, gender: string, username: string) => void;
}

interface State {
    agreed: boolean;
    age: Demographic;
    gender: Demographic;
    username: string;
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
            username: ''
        }
    }

    handleAgree = () => {
        this.setState({ agreed: !this.state.agreed });
    }

    onUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const username = e.currentTarget.value;
        this.setState({ username });
    }

    onAgeSelect = (value: string) => {
        const age = ages.find((val: Demographic) => val.name === value) as Demographic;
        this.setState({ age });
    }

    onGenderSelect = (value: string) => {
        const gender = genders.find((val: Demographic) => val.name === value) as Demographic;
        this.setState({ gender });
    }

    onSubmit = () => {
        const { age, agreed, gender, username } = this.state;
        if (!agreed || !age || !gender || !username) {
            return;
        }
        this.props.onSubmit(age.id, gender.id, username);
    }

    render() {
        const { age, agreed, gender, username } = this.state;
        const terms = '/skilmalar';
        const privacypolicy = '/personuvernd';
        return (
            <DemographicContainer>
                <UsernameInput
                    label={'Notendanafn'}
                    onChange={this.onUsernameChange}
                />
                <DropdownButton
                    content={ages.map((age: Demographic) => age.name)}
                    label={'Aldur'}
                    onSelect={this.onAgeSelect}
                    selected={age.name}
                />
                <DropdownButton
                    content={genders.map((gender: Demographic) => gender.name)}
                    label={'Kyn'}
                    onSelect={this.onGenderSelect}
                    selected={gender.name}
                />
                <Information title={'Hvers vegna skiptir þetta máli?'}>
                    <p>
                        Ofantaldar upplýsingar eru notaðar til að meta hversu lýðfræðilega dreift gagnasafnið er. Því dreifðara og fjölbreyttara sem það er, því betra. Sjá <NewTabLink href={terms}>skilmála</NewTabLink> og <NewTabLink href={privacypolicy}>persónuverndaryfirlýsingu</NewTabLink> verkefnisins.
                    </p>
                </Information>
                <AgreeContainer onClick={this.handleAgree}>
                    <Checkbox checked={agreed} onChange={this.handleAgree} />
                    <span>Ég staðfesti að hafa kynnt mér <NewTabLink href={terms}>skilmála</NewTabLink> og <NewTabLink href={privacypolicy}>persónuverndaryfirlýsingu</NewTabLink> verkefnisins.</span>
                </AgreeContainer>
                <SubmitButton onClick={this.onSubmit} disabled={!agreed || !age.name || !gender.name || !username}><span>Áfram</span></SubmitButton>
            </DemographicContainer>
        );
    }
}
