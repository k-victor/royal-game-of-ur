import {drop, curry, concat, flip} from 'ramda';

export const add = (value1, value2) => value1 + value2;
export const addTo = curry(add);
export const subtract = (value1, value2) => (value1 - value2 >= 0 ? value1 - value2 : 0);
export const multiply = (value1, value2) => value1 * value2;
export const inverseValue = (value) => (value === 0 ? 1 : 0);
export const inverse = (array) => array.map(inverseValue);
export const multiplyArrays = (array1, array2) => zipWith(array1, array2, multiply);
export const addArrays = (array1, array2) => zipWith(array1, array2, add);
export const subtractArrays = (array1, array2) => zipWith(array1, array2, subtract);
export const createArrayFromValue = (value) => [value];
export const flippedConcat = flip(concat);
export const largerThanOneToOne = (value) => (value > 1 ? 1 : value);
export const toNil = () => 0;

// [a] -> [b] -> ((a, b) -> c) -> [c]
export const zipWith = (arr1, arr2, mappingFn) => {
    if(arr1.length && arr2.length && mappingFn) {
        const arr1Value = arr1[0];
        const arr2Value = arr2[0];

        return concat([mappingFn(arr1Value, arr2Value)], zipWith(drop(1, arr1), drop(1, arr2), mappingFn));
    } else if(arr1.length) {
        return arr1;
    } else if(arr2.length) {
        return arr2;
    } else {
        return [];
    }
};
