export declare type ActionResult = {success: boolean; statusCode: number; result: bigint | string | boolean | undefined}
export interface Token {
    name: string
    address: string
    decimals: bigint
    abi: any[]
}