import type { Type } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import type { Module } from '@nestjs/core/injector/module';
import { PUBSUB_EVENT_HANDLER_METADATA } from '../decorator';
import type { AbstractPubsubAnyEventHandler } from '../interface';

// Mirrors @nestjs/cqrs internal decorator constants, which are not exported from the package root
const COMMAND_HANDLER_METADATA = '__commandHandler__';
const QUERY_HANDLER_METADATA = '__queryHandler__';
const EVENTS_HANDLER_METADATA = '__eventsHandler__';
const SAGA_METADATA = '__saga__';

@Injectable()
export class ExplorerService {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    explore(): Record<'commands' | 'queries' | 'events' | 'sagas', InstanceWrapper[]> {
        return {
            commands: this.findByMetadataKey(COMMAND_HANDLER_METADATA),
            queries: this.findByMetadataKey(QUERY_HANDLER_METADATA),
            events: this.findByMetadataKey(EVENTS_HANDLER_METADATA),
            sagas: this.findByMetadataKey(SAGA_METADATA),
        };
    }

    pubsubEvents(): Type<AbstractPubsubAnyEventHandler>[] {
        return this.findByMetadataKey(PUBSUB_EVENT_HANDLER_METADATA)
            .map((wrapper) => wrapper.metatype)
            .filter((metatype): metatype is Type<AbstractPubsubAnyEventHandler> => !!metatype);
    }

    private findByMetadataKey(metadataKey: string): InstanceWrapper[] {
        return [...this.modulesContainer.values()].flatMap((moduleRef: Module) =>
            [...moduleRef.providers.values()].filter((wrapper) => {
                const clsRef = wrapper.instance?.constructor ?? wrapper.metatype;
                return !!clsRef && !!Reflect.getMetadata(metadataKey, clsRef);
            }),
        );
    }
}
