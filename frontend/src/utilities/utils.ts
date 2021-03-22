import React from 'react';

/**
 * This method shuffles the input array randomly using the Fisher-Yates shuffle.
 * @param array the array to be shuffled
 */
export function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // random index
        [array[j], array[i]] = [array[i], array[j]]; // reassing using destructuring
    }
}

export function isChromium() {
    // TODO:  Use feature detection when possible.

    // Check if is chrome
    const isChrome = !!window.chrome;

    // Thank you https://stackoverflow.com/a/9851769
    // Edge (based on chromium) detection
    const isEdgeChromium =
        isChrome && navigator.userAgent.indexOf('Edg') !== -1;
    return isChrome || isEdgeChromium;
}

interface timestampDigits {
    h1: string;
    h2: string;
    m1: string;
    m2: string;
    s1: string;
    s2: string;
}

/**
 * Change seconds to a HH:mm:ss timestamp
 * @param seconds time in seconds
 */
export function splitSeconds(seconds: number): timestampDigits {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor((seconds % 3600) % 60);
    let h1: string, h2: string, m1: string, m2: string, s1: string, s2: string;
    if (remainingSeconds > 9) {
        [s1, s2] = Array.from(remainingSeconds.toString());
    } else {
        s1 = '0';
        s2 = remainingSeconds.toString();
    }
    if (minutes > 9) {
        [m1, m2] = Array.from(minutes.toString());
    } else {
        m1 = '0';
        m2 = minutes.toString();
    }
    if (hours > 9) {
        [h1, h2] = Array.from(hours.toString());
    } else {
        h1 = '0';
        h2 = hours.toString();
    }
    return { h1, h2, m1, m2, s1, s2 };
}

export function getTimestampString({
    h1,
    h2,
    m1,
    m2,
    s1,
    s2,
}: timestampDigits): string {
    if (h1 === '0' && h2 === '0') {
        return m1 + m2 + ':' + s1 + s2;
    } else {
        return h1 + h2 + ':' + m1 + m2 + ':' + s1 + s2;
    }
}

export function getHumanReadableTime({
    h1,
    h2,
    m1,
    m2,
    s1,
    s2,
}: timestampDigits): string {
    const hrs = 'klst.';
    const mins = 'mín.';
    const secs = 'sek.';
    // Remove leading zeros
    const [displayh1, displaym1, displays1] = [h1, m1, s1].map((digit) =>
        digit === '0' ? '' : digit
    );
    if (h1 === '0' && h2 === '0') {
        return [displaym1 + m2, mins, displays1 + s2, secs].join(' ');
    } else {
        return [displayh1 + h2, hrs, displaym1 + m2, mins].join(' ');
    }
}

/**
 * Credit to stackoverflow: https://stackoverflow.com/questions/32916786/react-children-map-recursively
 * Reursivly goes over the input React.ReactNode and executes the
 * input function of all of the children, grandchildren and so forth
 * @param children
 * @param fn the function to execute on all decendants
 * @returns a modified ReactNode according to the fn
 */
export const recursiveMap = (
    children: React.ReactNode,
    fn: any
): React.ReactNode => {
    return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        if (child.props.children) {
            child = React.cloneElement(child, {
                children: recursiveMap(child.props.children, fn),
            });
        }

        return fn(child);
    });
};
