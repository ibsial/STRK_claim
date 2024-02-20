import {claim, sendToExch, sleepBetweenAccs} from './config'
import {MnemonicStarknetWallet} from './src/MnemonicWallet'
import {PrivateKeyWallet} from './src/PrivateKeyWallet'
import {getMnemonicData, getPrivatesData, importProxies} from './src/fs_manipulations.js'
import {RandomHelpers, c, defaultSleep} from './src/helpers'
import {ETH, STRK} from './src/tokens'

async function runWallet(wallet: MnemonicStarknetWallet | PrivateKeyWallet) {
    if (!wallet.exchAddress && sendToExch) {
        console.log(`want to send to EXCH but no address provided`)
        return
    }
    if (wallet.type == 'seed') {
        let initRes = await wallet.init()
        if (!initRes.result) {
            console.log(`${wallet.starknetAddress} wallet not deployed`)
            return
        }
    }
    if (wallet.type == 'private') {
        let initRes = await wallet.isAccountDeployed()
        if (!initRes.result) {
            console.log(`${wallet.starknetAddress} wallet not deployed`)
            return
        }
    }
    console.log(`wallet inited`)
    if (claim) {
        let claimData = await wallet.getClaimData()

        if (claimData == undefined) {
            console.log('wallet not eligible')
            return
        }
        await wallet.claim({
            identity: claimData.identity,
            balance: BigInt(claimData.amount) * 10n ** 18n,
            index: claimData.merkle_index,
            merkle_path: claimData.merkle_path
        })
    }
    if (sendToExch) {
        let transfer = await wallet.transfer(STRK)
    }
}

async function main() {
    const mode = process.argv[2].toLowerCase()
    if (mode == 'seed') {
        let wallets = await getMnemonicData(sendToExch)
        const promises = []
        for (let i = 0; i < wallets.length; i++) {
            let wallet = new MnemonicStarknetWallet(wallets[i][0], wallets[i][1], wallets[i][2])
            console.log(c.magenta(`[${i + 1}] ${wallet.starknetAddress} started`))
            const promise = runWallet(wallet)
            promises.push(promise)
            await defaultSleep(RandomHelpers.getRandomIntFromTo(sleepBetweenAccs.from, sleepBetweenAccs.to), false)
        }
        console.log(c.magenta(`all wallets started`))
        await Promise.all(promises)
        console.log(c.magenta(`all wallets done!`))
        return
    }
    if (mode == 'private') {
        let wallets = await getPrivatesData(sendToExch)
        const promises = []
        for (let i = 0; i < wallets.length; i++) {
            let wallet = new PrivateKeyWallet(wallets[i][0], wallets[i][1], wallets[i][2])
            console.log(c.magenta(`[${i + 1}] ${wallet.starknetAddress} started`))
            const promise = runWallet(wallet)
            promises.push(promise)
            await defaultSleep(RandomHelpers.getRandomIntFromTo(sleepBetweenAccs.from, sleepBetweenAccs.to), false)
        }
        console.log(c.magenta(`all wallets started`))
        await Promise.all(promises)
        console.log(c.magenta(`all wallets done!`))
        return
    }
    console.log('invalid start type. Choose `seed` or `private` only')
}
main()
