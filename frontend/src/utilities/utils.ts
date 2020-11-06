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
