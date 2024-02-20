import {erc20_abi} from '../abi/erc20'
import {Token} from './types'

export const STRK: Token = {
    name: 'STRK',
    address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    decimals: 18n,
    abi: erc20_abi
}
export const ETH: Token = {
    name: 'ETH',
    address: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    decimals: 18n,
    abi: erc20_abi
}
