import { ModulesContainer } from '@nestjs/core';
import type { ICommandHandler, IEventHandler, IQueryHandler } from '@nestjs/cqrs';
import { CommandHandler, EventsHandler, QueryHandler, Saga } from '@nestjs/cqrs';
import type { Observable } from 'rxjs';
import { EMPTY } from 'rxjs';
import { PubsubEventHandler } from '../../../src/decorator';
import type { AbstractSubscriptionEvent } from '../../../src/interface';
import { AbstractPubsubEvent, AbstractPubsubHandler } from '../../../src/interface';
import { ExplorerService } from '../../../src/service/ExplorerService';

class TestCommand {}
class TestQuery {}
class TestEvent {}
class TestPubsubEvent extends AbstractPubsubEvent<Record<string, never>> {}

@CommandHandler(TestCommand)
class TestCommandHandler implements ICommandHandler<TestCommand> {
    async execute(): Promise<void> {}
}

@QueryHandler(TestQuery)
class TestQueryHandler implements IQueryHandler<TestQuery> {
    async execute(): Promise<void> {}
}

@EventsHandler(TestEvent)
class TestEventHandler implements IEventHandler<TestEvent> {
    handle(): void {}
}

class TestSagas {
    @Saga()
    saga = (): Observable<never> => EMPTY;
}

@PubsubEventHandler(TestPubsubEvent)
class TestPubsubHandler extends AbstractPubsubHandler<AbstractSubscriptionEvent<any>> {
    async handle(): Promise<void> {}
}

class NonHandlerClass {}

describe('ExplorerService', () => {
    let modulesContainer: ModulesContainer;
    let explorerService: ExplorerService;

    const addModule = (name: string, wrappers: object[]): void => {
        modulesContainer.set(name, { providers: new Map(wrappers.map((wrapper, i) => [`${name}_${i}`, wrapper])) } as any);
    };

    const wrapperOf = (metatype: new () => object): object => ({ metatype, instance: new metatype() });

    beforeEach(() => {
        modulesContainer = new ModulesContainer();
        explorerService = new ExplorerService(modulesContainer);
    });

    describe('explore', () => {
        it('should group wrappers decorated with @nestjs/cqrs decorators', () => {
            const command = wrapperOf(TestCommandHandler);
            const query = wrapperOf(TestQueryHandler);
            const event = wrapperOf(TestEventHandler);
            const saga = wrapperOf(TestSagas);
            const pubsub = wrapperOf(TestPubsubHandler);
            addModule('A', [command, query, wrapperOf(NonHandlerClass)]);
            addModule('B', [event, saga, pubsub]);

            expect(explorerService.explore()).toEqual({
                commands: [command],
                queries: [query],
                events: [event, pubsub],
                sagas: [saga],
            });
        });

        it('should return empty groups for an empty container', () => {
            expect(explorerService.explore()).toEqual({ commands: [], queries: [], events: [], sagas: [] });
        });
    });

    describe('pubsubEvents', () => {
        it('should return metatypes of pubsub handlers across modules', () => {
            addModule('A', [wrapperOf(TestPubsubHandler), wrapperOf(NonHandlerClass)]);
            addModule('B', [wrapperOf(TestEventHandler)]);

            expect(explorerService.pubsubEvents()).toEqual([TestPubsubHandler]);
        });

        it('should fall back to metatype when the wrapper has no instance', () => {
            addModule('A', [{ metatype: TestPubsubHandler, instance: undefined }]);

            expect(explorerService.pubsubEvents()).toEqual([TestPubsubHandler]);
        });

        it('should skip wrappers without instance and metatype', () => {
            addModule('A', [
                { metatype: undefined, instance: undefined },
                { metatype: null, instance: null },
            ]);

            expect(explorerService.pubsubEvents()).toEqual([]);
        });
    });
});
