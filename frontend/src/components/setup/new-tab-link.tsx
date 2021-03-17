import * as React from 'react';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement>;

const NewTabLink: React.FC<Props> = (props: Props) => {
    return (
        <a
            {...props}
            href={props.href}
            target="_blank"
            rel="noopener noreferrer"
        >
            {props.children}
        </a>
    );
};

export default NewTabLink;
