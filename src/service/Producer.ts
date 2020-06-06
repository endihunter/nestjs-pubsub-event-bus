import { Options } from 'amqplib';
import { ChannelWrapper } from 'amqp-connection-manager';
import { PubsubManager } from './PubsubManager';

export abstract class Producer extends PubsubManager {
    protected readonly defaultHeaders: Options.Publish = {
        deliveryMode: 2,
        contentType: 'application/json',
    };

    protected customHeaders: Options.Publish = {};

    withHeaders(value: Options.Publish): Producer {
        this.customHeaders = value;
        return this;
    }

    /**
     * Produce an event.
     * @param event - event name (Ex.: store.created, user.updated, order.cancelled, etc...)
     * @param payload - message payload
     */
    async produce(event: string, payload: Record<string, any>): Promise<void> {
        let channel: ChannelWrapper | undefined;
        try {
            channel = await this.channel();
            console.info(
                `Publish "${event}" to "${this.exchange()}" with`,
                JSON.stringify(payload),
                JSON.stringify({
                    ...this.messageHeaders(),
                    type: event,
                }),
            );
            await channel.publish(this.exchange(), event, payload, { ...this.messageHeaders(), type: event });
        } finally {
            channel && (await channel.close());
            this.connection && (await this.connection.close());
        }
    }

    abstract payload(): Record<string, any>;

    protected messageHeaders(): Options.Publish {
        return { ...this.defaultHeaders, ...this.customHeaders };
    }
}
