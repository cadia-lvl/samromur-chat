import * as React from 'react';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement>;

const SafeTabLink: React.FC<Props> = (props: Props) => {
    return (
        <a href={props.href} target="_blank" rel="noopener noreferrer">
            {props.children}
        </a>
    );
};

export default SafeTabLink;
