import {formatUnits, parseUnits} from 'ethers'
import {SingleBar, Presets} from 'cli-progress'
import c from 'chalk'
import {Account} from 'starknet'
import {ActionResult} from './types'

const log = console.log
const timeout = 5 * 60

class Numbers {
    bigIntToFloatStr(amount: bigint, decimals: bigint): string {
        return formatUnits(amount, decimals)
    }
    bigIntToPrettyFloatStr(amount: bigint, decimals: bigint): string {
        return parseFloat(formatUnits(amount, decimals)).toFixed(5)
    }
    floatStringToBigInt(floatString: string, decimals: bigint): bigint {
        return parseUnits(floatString, decimals)
    }
}

class Random {
    NumbersHelpers: Numbers
    constructor(NumbersHelpers: Numbers) {
        this.NumbersHelpers = NumbersHelpers
    }
    getRandomInt(max: number): number {
        return Math.floor(Math.random() * max)
    }
    getRandomIntFromTo(min: number, max: number): number {
        const delta = max - min
        return Math.round(min + Math.random() * delta)
    }
    getRandomBnFromTo(min: bigint, max: bigint): bigint {
        const delta = max - min
        const random = BigInt(Math.round(Math.random() * 100))
        return min + (delta * random) / 100n
    }
    getRandomValue(min: string, max: string): bigint {
        const from = this.NumbersHelpers.floatStringToBigInt(min, 18n)
        const to = this.NumbersHelpers.floatStringToBigInt(max, 18n)
        return this.getRandomBnFromTo(from, to)
    }
    getRandomDeadline(): number {
        let hour = 3600
        let tsNow = Date.now() / 1000 // timestamp in sec
        // deadline from +1 day to +6 days
        let tsRandom = Math.round(tsNow + hour * (Math.random() * this.getRandomInt(3) + 1))
        return tsRandom
    }
    shuffleArray(oldArray: any[]): any[] {
        let array = oldArray.slice()
        let buf
        for (let i = 0; i < array.length; i++) {
            buf = array[i]
            let randNum = Math.floor(Math.random() * array.length)
            array[i] = array[randNum]
            array[randNum] = buf
        }
        return array
    }
    chooseKeyFromStruct(struct: {[key: string]: any}, notKey = ''): string {
        const keys = Object.keys(struct)
        let res = keys[Math.floor(Math.random() * keys.length)]
        while (res == notKey) {
            res = keys[Math.floor(Math.random() * keys.length)]
        }
        return res
    }
    chooseElementFromArray<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)]
    }
}
function removeElementFromArray(arr: any[], element: any): void {
    const index = arr.indexOf(element)
    if (index > -1) {
        // only splice array when item is found
        arr.splice(index, 1) // 2nd parameter means remove one item only
    }
}
async function getTxStatus(account: Account, hash: string, pasta: string): Promise<ActionResult> {
    try {
        await account.waitForTransaction(hash)
        const txReceipt = await account.getTransactionReceipt(hash)
        // log(txReceipt)
        let status: any = txReceipt.status
        // log(status)
        if (status == undefined && 'execution_status' in txReceipt) {
            status = txReceipt.finality_status
            // return { success: false, statusCode: 0, transactionHash: hash }
        }
        if (status == 'REJECTED' || status == 'REVERTED') {
            return {success: false, statusCode: -1, result: 'tx rejected'}
        }
        return {success: true, statusCode: 1, result: pasta}
    } catch (e) {
        // log(e)
        return {success: false, statusCode: 0, result: hash}
    }
}
async function sleep(sec: number, reason = 'Sleep') {
    if (sec > 1) {
        sec = Math.round(sec)
    }
    let bar = new SingleBar({format: `${reason} | ${c.blueBright('{bar}')} | {percentage}% | {value}/{total} sec`}, Presets.rect)
    bar.start(sec, 0)
    for (let i = 0; i < sec; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1 * 1000))
        bar.increment()
    }
    bar.stop()
    process.stdout.clearLine(0)
}
async function defaultSleep(sec: number, needProgress = true) {
    if (needProgress) {
        let newpaste = ['-', `\\`, `|`, `/`]
        for (let i = 0; i < sec * 2; i++) {
            process.stdout.clearLine(0) // clear current text
            process.stdout.cursorTo(0)
            process.stdout.write(`${newpaste[i % 4]}`)
            await await new Promise((resolve) => setTimeout(resolve, 500))
        }
        process.stdout.clearLine(0) // clear current text
        process.stdout.cursorTo(0)
        return
    }
    return await new Promise((resolve) => setTimeout(resolve, sec * 1000))
}
const retry = async (fn: any, {retries = 0, maxRetries = 15, retryInterval = 3, backoff = 1}, ...args: any): Promise<any> => {
    retryInterval = retryInterval * backoff
    if (retries >= maxRetries) {
        console.log('retry limit exceeded, marking action as false')
        return {success: false, statusCode: 0, result: undefined}
    }
    let tries = retries + 1
    // call function and work on error
    try {
        let result = await fn(...args)
        if (result.statusCode == undefined) {
            return result
        }
        if (result.statusCode == 1) {
            return result
        } else if (result.statusCode < 0) {
            return result
        }
        console.log(result.transactionHash ?? result)
        console.log(`action failed for some reason, retrying... [${tries} / ${maxRetries}]`)
        await defaultSleep(retryInterval)
        return await retry(fn, {retries: tries, retryInterval, maxRetries, backoff}, ...args)
    } catch (e) {
        console.log(e)
        console.log(`catched error, retrying... [${tries}]`)
        console.log(c.magenta('if you see this, please contact the author and tell about error above'))
        await defaultSleep(retryInterval * 2)
    }
    return await retry(fn, {retries: tries, retryInterval, maxRetries, backoff}, ...args)
}
const NumbersHelpers = new Numbers()
const RandomHelpers = new Random(NumbersHelpers)

export {log, c, timeout, NumbersHelpers, RandomHelpers, removeElementFromArray, retry, sleep, defaultSleep, getTxStatus}
