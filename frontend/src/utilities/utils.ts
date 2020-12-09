/**
 * This method shuffles the input array randomly using the Fisher-Yates shuffle.
 * @param array the array to be shuffled
 */
export function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index
        [array[j], array[i]] = [array[i], array[j]]; // reassing using destructuring
    }
}

export function isChromium() {
    // TODO:  Use feature detection when possible.

    // Check if is chrome
    let isChrome = !!window.chrome;

    // Thank you https://stackoverflow.com/a/9851769
    // Edge (based on chromium) detection
    let isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') !== -1;
    return isChrome || isEdgeChromium;
}

export function splitSeconds(
    seconds: number
): { m1: string; m2: string; s1: string; s2: string } {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;
    let m1: string, m2: string, s1: string, s2: string;
    if (remainingSeconds > 9) {
        [s1, s2] = remainingSeconds.toString();
    } else {
        s1 = '0';
        s2 = remainingSeconds.toString();
    }
    if (minutes > 9) {
        [m1, m2] = minutes.toString();
    } else {
        m1 = '0';
        m2 = minutes.toString();
    }
    return { m1, m2, s1, s2 };
}
