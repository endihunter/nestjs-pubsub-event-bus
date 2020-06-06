import { Injectable } from '@nestjs/common';
import { EventBus as NestEventBus, EventHandlerType, IEvent } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { IEventHandler } from '@nestjs/cqrs/dist/interfaces';
import { ConsumeMessage } from 'amqplib';
import { toEventName } from '../utils';
import { PUBSUB_EVENT_HANDLER_METADATA } from '../decorator';
import { CommandBus } from './CommandBus';
import { Consumer } from './Consumer';

@Injectable()
export class EventBus<EventBase extends IEvent = IEvent> extends NestEventBus {
    constructor(commandBus: CommandBus, private moduleRefs: ModuleRef) {
        super(commandBus, moduleRefs);
    }

    registerPubsubHandlers(handlers: EventHandlerType<EventBase>[] = []): void {
        handlers.forEach((handler) => this.registerPubsubHandler(handler));
    }

    bindPubsub(handler: IEventHandler<EventBase>, events: string[]): void {
        const consumer: Consumer = (handler as unknown) as Consumer;
        consumer.listenFor(events);
        consumer
            .consume((msg: ConsumeMessage | null): void => {
                msg && (handler as IEventHandler).handle(JSON.parse(msg?.content.toString()));
            })
            .then(() => {})
            .catch(() => {});
    }

    protected registerPubsubHandler(handler: EventHandlerType<EventBase>): void {
        const instance = this.moduleRefs.get(handler, { strict: false });
        if (!instance) {
            return;
        }

        const events: string[] = this.reflectPubsubEventsNames(handler).map((event) => toEventName(event.name));
        this.bindPubsub(instance, events);
    }

    protected reflectPubsubEventsNames(handler: EventHandlerType<EventBase>): FunctionConstructor[] {
        return Reflect.getMetadata(PUBSUB_EVENT_HANDLER_METADATA, handler) as FunctionConstructor[];
    }
}
