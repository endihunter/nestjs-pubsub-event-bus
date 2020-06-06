import { PubsubPlatformExchangeEnum } from '../interface';
import { Producer } from '../service';
import { IStoreCreatedPayload } from './IStoreCreatedPayload';

export class StoreCreated extends Producer {
    constructor(readonly merchantId: string, readonly storeId: string) {
        super();
    }

    exchange(): PubsubPlatformExchangeEnum {
        return PubsubPlatformExchangeEnum.PLATFORM_STORE_V2;
    }

    payload = (): IStoreCreatedPayload => ({
        merchantId: this.merchantId,
        storeId: this.storeId,
    });
}
