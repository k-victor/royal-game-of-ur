import {drop, curry, concat} from 'ramda';

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
export const reverseConcat = curry((arr1, arr2) => concat(arr2, arr1));
export const sumUpBoard = (array) => array.reduce((sum, value) => sum + value);

export const zipWith = (arr1, arr2, mappingFn) => {
    if(arr1.length && arr2.length && mappingFn) {
        const arr1Value = arr1[0];
        const arr2Value = arr2[0];
        return [mappingFn(arr1Value, arr2Value)].concat(zipWith(drop(1, arr1), drop(1, arr2), mappingFn));
    } else {
        return [];
    }
};
