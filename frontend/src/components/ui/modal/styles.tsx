import * as React from 'react';
import styled from 'styled-components';
import ReactModal from 'react-modal';

ReactModal.setAppElement('body');

interface ModalProps extends ReactModal.Props {
    className?: string;
}

const ReactModalAdapter: React.SFC<ModalProps> = ({
    className,
    ...props
}: ModalProps) => {
    const contentClassName = `${className}__Content`;
    const overlayClassName = `${className}__Overlay`;
    return (
        <ReactModal
            closeTimeoutMS={250}
            portalClassName={className}
            className={contentClassName}
            overlayClassName={overlayClassName}
            {...props}
        />
    );
};

export const Modal = styled(ReactModalAdapter)`
    &__Overlay {
        position: fixed;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        transition: opacity 0.25s ease-in-out;
        display: table;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.8);
        opacity: 0;

        &.ReactModal__Overlay--after-open {
            opacity: 1;
        }

        &.ReactModal__Overlay--before-close {
            opacity: 0;
        }
    }

    &__Content {
        position: static !important;
        display: table-cell;
        vertical-align: middle;
        pointer-events: none;
        border: none !important;
        width: 100%;

        & .inner {
            position: relative;
            margin: 0 auto;
            box-sizing: border-box;
            padding: 2rem;
            max-width: 40rem;
            min-height: auto;
            width: 100%;
            text-align: center;
            background: white;
            pointer-events: all;
            box-shadow: 0 2px 44px 0 color-mod(#0043a0 alpha(50%));
        }
    }
`;

export default Modal;
