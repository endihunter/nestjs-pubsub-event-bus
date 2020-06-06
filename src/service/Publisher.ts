import { IEvent } from '@nestjs/cqrs';
import { DefaultPubSub } from '@nestjs/cqrs/dist/helpers/default-pubsub';
import { toEventName } from '../utils';
import { Producer } from './Producer';

export class Publisher<EventBase extends IEvent> extends DefaultPubSub<EventBase> {
    async publish<T extends EventBase>(event: T): Promise<void> {
        super.publish(event);

        if (event instanceof Producer) {
            await event.produce(toEventName(event.constructor.name), event.payload());
        }
    }
}
