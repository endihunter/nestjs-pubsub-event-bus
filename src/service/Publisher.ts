import { Injectable } from '@nestjs/common';
import type { IEvent, IEventPublisher } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { AbstractPubsubEvent } from '../interface';
import { Producer } from './Producer';

@Injectable()
export class Publisher<EventBase extends IEvent = IEvent> implements IEventPublisher<EventBase> {
    constructor(
        private readonly subject$: Subject<EventBase>,
        private readonly producer: Producer,
    ) {}

    async publish<T extends EventBase>(event: T): Promise<void> {
        if (event instanceof AbstractPubsubEvent) {
            event.localEventEnabled() && this.publishLocally(event);
            return this.producer.produce(event);
        }

        return this.publishLocally(event);
    }

    publishLocally<T extends EventBase>(event: T): void {
        this.subject$.next(event);
    }
}
