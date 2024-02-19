import {Account, ContractVersion, LibraryError, getChecksumAddress} from 'starknet'
import {MnemonicStarknetWallet} from './MnemonicWallet'
import {ActionResult} from './types'

class PrivateKeyWallet extends MnemonicStarknetWallet {
    type: string

    publicKey: string | undefined
    validKey: string

    constructor(address: string, validKey: string, exchAddress: string) {
        super(undefined, undefined, exchAddress) // a fake wallet will be created
        // now we need to overwrite key and account
        this.starknetAddress = getChecksumAddress(address)
        this.validKey = validKey
        this.type = 'private'
    }
    async isAccountDeployed(address?: string): Promise<ActionResult> {
        if (!address) address = this.starknetAddress
        try {
            let version: ContractVersion = await this.starkProvider.getContractVersion(address)
            if (version == undefined) {
                return {success: true, statusCode: 1, result: false}
            }
            this.starknetAccount = new Account(this.starkProvider, this.starknetAddress, this.validKey, version.cairo)
            return {success: true, statusCode: 1, result: true}
        } catch (e: any) {
            console.log(e.message)
            if (e instanceof LibraryError && e.message.includes('Contract not found')) {
                return {success: true, statusCode: 1, result: false}
            }
            this.changeProvider()
            return this.isAccountDeployed(address)
        }
    }
}

export {PrivateKeyWallet}
