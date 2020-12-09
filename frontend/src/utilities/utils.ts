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
