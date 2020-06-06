import * as RabbitManager from 'amqp-connection-manager';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { OnModuleDestroy } from '@nestjs/common';
import { PubsubPlatformExchangeEnum } from '../interface';
import { ConnectionProvider } from './ConnectionProvider';

export abstract class PubsubManager implements OnModuleDestroy {
    protected connection: AmqpConnectionManager;
    protected channelWrapper: ChannelWrapper;

    async onModuleDestroy(): Promise<any> {
        await this.channelWrapper.close();
        await this.connection.close();
    }

    // exchange that should be used
    abstract exchange(): PubsubPlatformExchangeEnum;

    protected async channel(onExchangeCreated?: (channel: ConfirmChannel) => any): Promise<ChannelWrapper> {
        this.connection = RabbitManager.connect(ConnectionProvider.connections, {
            heartbeatIntervalInSeconds: 3,
            reconnectTimeInSeconds: 3,
        });

        this.channelWrapper = this.connection.createChannel({
            json: true,
            setup: async (channel: ConfirmChannel): Promise<any> => {
                await channel.assertExchange(this.exchange(), 'topic', { durable: true, autoDelete: false });

                onExchangeCreated && onExchangeCreated(channel);
            },
        });

        return this.channelWrapper;
    }
}
