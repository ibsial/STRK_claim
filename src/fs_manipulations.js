import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import * as stream from 'stream'
import {once} from 'events'
import {Mnemonic} from 'ethers'
import chalk from 'chalk'
// const __dirname = path.resolve(),

export const importData = async (filename) => {
    let data = []
    let instream = fs.createReadStream(path.join(__dirname, `${filename}`))
    let outstream = new stream.Stream()
    let rl = readline.createInterface(instream, outstream)
    rl.on('line', (line) => {
        data.push(line)
    })
    await once(rl, 'close')
    return data
}
export const appendResultsToFile = (file, data) => {
    fs.appendFileSync(`${file}`, data + '\n', (err) => {
        if (err) throw err
    })
}
export const writeToFile = async (file, data) => {
    await fs.writeFile(`${file}`, data + '\n', (err) => {
        if (err) throw err
    })
}
// read (mnemonic,index,exchAddr) file
export const getMnemonicData = async (sendToExch = true) => {
    let initialData = await importData('../seeds.txt')
    let wallets = []
    for (let [index, data] of initialData.entries()) {
        let wallet = data.split(',')
        if (!Mnemonic.isValidMnemonic(wallet[0])) {
            console.log(chalk.red('INVALID MNEMONIC FORMAT'), `\n[ ${index + 1} ] ${wallet[0]}`)
            throw new Error('Invalid mnemonic')
        }
        if (wallet[1] == '') {
            wallet[1] = undefined
        }
        if (sendToExch && !(64 <= wallet[2].length && wallet[2].length <= 66)) {
            throw new Error('Invalid exch address')
        }
        if (!sendToExch) {
            wallet[2] = undefined
        }
        wallets.push([wallet[0], wallet[1], wallet[2]])
    }
    return wallets
}
export const getPrivatesData = async (sendToExch = true) => {
    let initialData = await importData('../privates.txt')
    let wallets = []
    for (let [index, data] of initialData.entries()) {
        let wallet = data.split(',')
        if (64 > wallet[0].length && wallet[0].length > 66) {
            console.log(chalk.red('INVALID ADDRESS'), `\n[ ${index + 1} ] ${wallet[0]}`)
            throw new Error('Invalid address')
        }
        if (64 > wallet[1].length && wallet[1].length > 66) {
            console.log(chalk.red('INVALID PRIVATE KEY'), `\n[ ${index + 1} ] ${wallet[1]}`)
            throw new Error('Invalid private key')
        }
        if (sendToExch && 64 > wallet[2].length && wallet[2].length > 66) {
            console.log(chalk.red('INVALID exch address!'), `\n[ ${index + 1} ] ${wallet[2]}`)
            throw new Error('Invalid exch address')
        }
        if (!sendToExch) {
            wallet[2] = undefined
        }
        wallets.push([wallet[0], wallet[1], wallet[2]])
    }
    return wallets
}
export const importProxies = async () => {
    let proxies = []
    let instream = fs.createReadStream(path.join(__dirname, '../proxies.txt'))
    let outstream = new stream.Stream()
    let rl = readline.createInterface(instream, outstream)
    rl.on('line', (line) => {
        proxies.push(line)
    })
    await once(rl, 'close')
    if (proxies[0] == 'login:pass@ip:port') {
        return []
    }
    return proxies
}
