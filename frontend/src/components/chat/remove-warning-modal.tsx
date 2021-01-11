import * as React from 'react';
import Modal from '../ui/modal/modal';
import ReactModal from 'react-modal';
import styled from 'styled-components';
import { Button } from './controls';

ReactModal.setAppElement('body');

const Content = styled.div``;

const Title = styled.h2`
    text-align: center;
    margin-top: 0rem;
    margin-bottom: 2rem;
`;

const Text = styled.div`
    width: 100%;
    text-align: center;
    margin-bottom: 2rem;
`;

const RemoveLink = styled.div`
    display: inline-block;
    cursor: pointer;
    text-decoration: underline;
    font-size: 1rem;
    margin-top: 1rem;

    &: hover {
        color: red;
        font-weight: bold;
    }
`;

const ButtonsContainer = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
`;

interface WarningModalProps {
    onRemove: () => void;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

type Props = WarningModalProps;

export class RemoveWarningModal extends React.Component<Props> {
    onRemove = () => {
        const { onRemove, onClose } = this.props;
        onRemove();
        onClose();
    };

    render() {
        const { isOpen, onClose, onSubmit } = this.props;
        return (
            <Modal isOpen={isOpen} onRequestClose={onClose}>
                <Content>
                    <Title>Það er ekki búið að senda inn upptökuna</Title>
                    <Text>
                        Við viljum allar upptökur, stuttar eða langar. Viltu
                        samt eyða upptökunni?
                    </Text>
                    <ButtonsContainer>
                        <Button onClick={onClose}>Til baka</Button>
                        <Button green onClick={onSubmit}>
                            Nei, senda núna!
                        </Button>
                    </ButtonsContainer>
                    <RemoveLink onClick={this.onRemove}>
                        Já, eyða upptökunni
                    </RemoveLink>
                </Content>
            </Modal>
        );
    }
}
