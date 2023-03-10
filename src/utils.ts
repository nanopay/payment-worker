import { Unit, convert, checkAddress } from 'nanocurrency';

const MAX_DECIMALS = 6;

// Remove decimals without rounding
export const toFixedSafe = (num: number | string, fixed: number) => {
    const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    const match = num.toString().match(re);
    if (!match) throw new Error('toFixedSafe: invalid number');
    return match[0];
}

export const rawToNano = (raw: string) => {
    const nanoAmount = convert(raw, { from: Unit.raw, to: Unit.NANO });
    const fixedAmount = toFixedSafe(nanoAmount, MAX_DECIMALS);
    return Number(fixedAmount);
}

export const parseNanoAddress = (address: string) => {
    if (!checkAddress(address)) {
        throw new Error('Invalid Nano address');
    }
    return address.replace('xno_', 'nano_');
}

export const parseTime = (time: string | number) => {
    const date = new Date(time);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    return date.getTime();
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));