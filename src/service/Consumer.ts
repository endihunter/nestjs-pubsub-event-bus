import { ConfirmChannel, ConsumeMessage, Message, Options, Replies } from 'amqplib';
import { toEventName, toSnakeCase } from '../utils';
import { PubsubManager } from './PubsubManager';

export abstract class Consumer extends PubsubManager {
    protected events: string[] = [];

    protected readonly defaultQueueConfig: Options.AssertQueue = {
        durable: true,
        autoDelete: false,
    };

    /**
     * Listen for an event and consume its message payload
     *
     * @param onMessage - a callback that receives an event message
     */
    async consume(onMessage: (msg: ConsumeMessage | null) => any): Promise<void> {
        await this.channel(
            async (channel: ConfirmChannel): Promise<void> => {
                const q: Replies.AssertQueue = await channel.assertQueue(this.queue(), this.queueOptions());
                this.listenFor().map(async (event: string): Promise<any> => await channel.bindQueue(q.queue, this.exchange(), event));

                console.debug(`Listening for "${this.listenFor().toString()}" events from [${this.exchange()} <- ${this.queue()}]`);

                await channel.consume(q.queue, (msg: ConsumeMessage | null) => {
                    try {
                        onMessage(msg);
                        channel.ack(msg as Message);
                    } catch (e) {
                        // @tbd retry??? if so, retry mechanism maybe based on headers values...
                    }
                });
            },
        );
    }

    /**
     * Event, that consumer should listen for (Ex.: order.created, user.*, *.created, etc...)
     */
    listenFor = (events?: string[]): string[] => {
        if (events?.length) {
            this.events = events;
        }

        return this.events.length ? this.events : [toEventName(this.constructor.name.replace(/Handler$/i, ''))];
    };

    /**
     * Set custom Queue options
     */
    withQueueConfig = (): Options.AssertQueue => ({});

    /**
     * Queue that should be listened for events.
     */
    protected queue(): string {
        return [
            this.exchange(),
            (process.env.npm_package_name as string).replace('@goparrot/', '').replace(/[_-]/gi, '.'),
            toSnakeCase(this.constructor.name),
        ].join(':');
    }

    protected queueOptions(): Options.AssertQueue {
        return {
            ...this.defaultQueueConfig,
            ...this.withQueueConfig(),
        };
    }
}
