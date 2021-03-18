import { ages, genders } from '../constants/demographics';
import { Demographic, StoredDemographics } from '../types/user';

const defaultDemographics: StoredDemographics = {
    agreed: false,
    age: {
        id: '',
        name: '',
    },
    gender: {
        id: '',
        name: '',
    },
    username: '',
};

/**
 * Loads the demographics from the localstorage if existing or an empty
 * demographic if none found
 * @returns the demographics stored in localstorage
 */
export const loadDemographics = (): StoredDemographics => {
    const demoString = localStorage.getItem('demographics');

    if (!demoString) {
        return defaultDemographics;
    }

    const parsedDemographics = JSON.parse(demoString) as StoredDemographics;

    return combineWithDefault(parsedDemographics);
};

/**
 * Checks if there is a demographics in the localStorage
 * @returns true if there is else false
 */
export const demographicsInStorage = (): boolean => {
    const demo = localStorage.getItem('demographics');

    if (demo) {
        return true;
    }

    return false;
};

/**
 * Saves the demographics into the localstorage
 * @param demo the StoredDemographics object to save
 */
export const saveDemographics = (demo: StoredDemographics) => {
    localStorage.setItem('demographics', JSON.stringify(demo));
};

/**
 * Takes a demographics object and makes sure that the values are valid
 * Any non-valid values get set to the default values
 * @param demo the demographics object to combine with default
 * @returns a valid demographics object
 */
const combineWithDefault = (demo: any): StoredDemographics => {
    const { age, agreed, gender, username } = demo;
    const combinedDemographics = defaultDemographics;

    if (ageFound(age)) {
        combinedDemographics.age = age;
    }

    if (agreed !== undefined) {
        combinedDemographics.agreed = agreed;
    }

    if (genderFound(gender)) {
        combinedDemographics.gender = gender;
    }

    if (username) {
        combinedDemographics.username = username;
    }

    return combinedDemographics;
};

const genderFound = (gender: Demographic): boolean => {
    if (gender) {
        const found = genders.find(({ id }) => id === gender.id);
        if (found) {
            return true;
        }
    }
    return false;
};

const ageFound = (age: Demographic): boolean => {
    if (age) {
        const found = ages.find(({ id }) => id === age.id);
        if (found) {
            return true;
        }
    }
    return false;
};
