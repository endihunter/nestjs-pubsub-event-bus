# RabbitMQ CQRS module

RabbitMQ CQRS Module built on top of NestJS CQRS.
It gives the ability to use NestJS CqrsModule across microservice architecture, using RabbitMQ message broker.

## Installation

First install the required package:

`npm install --save @goparrot/pubsub-event-bus`

Optionally, install `peerDependencies`, recommended by a package.

## Import module

Import module & configure it by providing the connection string.

    @Module({
        imports: [
            CqrsModule.forRoot({
                connections: ['amqp://username:pass@example.com/virtualhost'],
            }),
        ],
    })
    export class AppModule {}

Note: `CqrsModule` is imported from `@goparrot/pubsub-event-bus` library.

## Publish event

Inject `EventBus` into your service/controller in order to emit events.

```ts
this.eventBus.publish(new StoreCreated('storeId', 'merchantId'));
```

### Create & publish events

Event is a simple class, that handles the event payload.

```ts
export class ItemCreated {
    constructor(readonly itemId: string, readonly createdAt: Date) {}
}
```

In order to make it a PubSub ready, it should extend a `Producer` class (from `@goparrot/pubsub-event-bus`).

Once extended, implement methods required by `Producer`:

`exchange` - the RabbitMQ exchange name (there is a list of predefined valid exchanges)

`payload` - event payload as plain object (it's better to provide the interface for event payload)

Example of predefined event:

```ts
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
```

## Listen for events

### Create event handler

Create a simple class which extends `Consumer` and implements `IEventHandler` interface
`Consumer` - comes from `@goparrot/pubsub-event-bus`
`IEventHandler` - comes from `@nestjs/cqrs`

```ts
@PubsubEventHandler(StoreCreated)
export class StoreCreatedHandler extends Consumer implements IEventHandler {
    handle(event: IStoreCreatedPayload | null) {
        console.log(`[${this.constructor.name}] ->`, event);
    }

    exchange(): PubsubPlatformExchangeEnum {
        return PubsubPlatformExchangeEnum.PLATFORM_STORE_V2;
    }
}
```

Notice, Unlike regular Cqrs events handlers, PubSub EventHandler uses its own decorator `@PubsubEventHandler(StoreCreated)`

`@PubsubEventHandler` decorator accepts a list of Events it is listening for, like:

```ts
@PubsubEventHandler(StoreCreated, UserCreated)
```

or it may be listening for all events in desired exchange ("#" - fanout), just add a `Fanout` event:

```ts
@PubsubEventHandler(Fanout)
```

### Implement required methods:

`handle` - central point where event payload will come

`exchange` - exchange, consumer will be bound its queue to.

### Register event handler

Register event handler you've just created as a module provider:

```ts
@Module({
    ...,
    providers: [StoreCreatedHandler],
})
export class AppModule {}
```

Once registered, event handler will start listening for incoming events.

## Configuration

In order to emit an event with extra headers, just call the `withHeaders({})` method and provide required configuration:

```ts
this.eventBus.publish(
    new StoreCreated('storeId').withHeaders({
        persistent: false,
        priority: 100,
        headers: ['...'],
    }),
);
```

The same goes for Event Handlers, you can define a method `withQueueConfig` in order to define queue configuration.

Also, you can define a very specific events, it will be listening for, by declaring the `listenFor` method.

```ts
@PubsubEventHandler(StoreCreated)
export class StoreCreatedHandler extends Consumer implements IEventHandler {
    ... other implementation ...

    withQueueConfig = (): Options.AssertQueue => ({
        exclusive: true,
        durable: false,
        messageTtl: 10,
    });

    listenFor = (events?: string[]): string[] => (['order.*', '*.created', 'user.*.*']);
}
```
