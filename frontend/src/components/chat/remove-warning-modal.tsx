import * as React from 'react';
import Modal from '../ui/modal/modal';
import ReactModal from 'react-modal';
import styled from 'styled-components';
import { Button } from './controls';

ReactModal.setAppElement('body');

const Content = styled.div``;

const Title = styled.h2`
    text-align: center;
    margin: 1rem 0rem;
`;

const Text = styled.div`
    width: 100%;
    text-align: center;
    margin-bottom: 1rem;
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
}

type Props = WarningModalProps;

export class RemoveWarningModal extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    onRemove = () => {
        const { onRemove, onClose } = this.props;
        onRemove();
        onClose();
    };

    render() {
        const { isOpen, onClose } = this.props;
        return (
            <Modal isOpen={isOpen} onRequestClose={onClose}>
                <Content>
                    <Title>Are you sure you want to delete?</Title>
                    <Text>
                        We like recordings of almost all sizes. Please consider
                        sending in the recording even if it is short.
                    </Text>
                    <ButtonsContainer>
                        <Button onClick={onClose}>Til baka</Button>
                        <Button red onClick={this.onRemove}>
                            Eg er viss
                        </Button>
                    </ButtonsContainer>
                </Content>
            </Modal>
        );
    }
}
