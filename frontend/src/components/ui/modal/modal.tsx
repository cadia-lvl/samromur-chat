import * as React from 'react';
import Modal from './styles';
import CloseIcon from '../icons/close';

interface Props {
    children?: React.ReactNode;
    onRequestClose?: (event?: React.MouseEvent | React.KeyboardEvent) => any;
    shouldReturnFocusAfterClose?: boolean;
    isOpen: boolean;
    clearBackground?: boolean;
}

export default class DefaultModal extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const { children } = this.props;

        return (
            <Modal {...this.props}>
                <div className="inner">{children}</div>
            </Modal>
        );
    }
}
