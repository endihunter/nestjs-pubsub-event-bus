import { CqrsModule as NestCqrsModule } from '@nestjs/cqrs';
import { DynamicModule, Module } from '@nestjs/common';
import { CommandBus, EventBus, ExplorerService, Publisher, QueryBus } from './service';
import { ICqrsModuleOptions } from './interface/ICqrsModuleOptions';
import { ConnectionProvider } from './service/ConnectionProvider';

@Module({
    imports: [NestCqrsModule],
    providers: [ExplorerService, Publisher, CommandBus, QueryBus, EventBus],
    exports: [EventBus, CommandBus, QueryBus],
})
export class CqrsModule {
    constructor(
        private readonly explorerService: ExplorerService,
        private readonly eventsBus: EventBus,
        private readonly commandsBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    static forRoot(options: ICqrsModuleOptions): DynamicModule {
        return {
            module: CqrsModule,
            global: options.isGlobal,
            providers: [
                {
                    provide: ConnectionProvider,
                    useFactory: (): ConnectionProvider => {
                        return new ConnectionProvider(options.connections);
                    },
                },
            ],
        };
    }

    onApplicationBootstrap(): void {
        this.eventsBus.publisher = new Publisher(this.eventsBus.subject$);
        const { events, queries, sagas, commands } = this.explorerService.explore();
        this.commandsBus.register(commands);
        this.queryBus.register(queries);
        this.eventsBus.registerSagas(sagas);
        this.eventsBus.register(events);
        this.eventsBus.registerPubsubHandlers(this.explorerService.pubsubEvents());
    }
}
