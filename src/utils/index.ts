import snakeCase from 'lodash/snakeCase';

/**
 * Transform an event string (event class name) to a RabbitMQ event.
 *
 * @example StoreCreated => "store.created"
 * @example OrderStatusUpdated => "order.status.updated"
 * @example Fanout => "#"
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const toEventName = (className: string): string => {
    className = snakeCase(className)
        .replace(/Event$/, '')
        .replace(/_/gi, '.');

    if ('fanout' === className) {
        return '#';
    }

    return className;
};

/**
 * Generate queue name based on Event/Handler class name
 *
 * @example StoreNotifierHandler => "store_notifier"
 * @example OrderStatusUpdatedHandler => "order_status_updated";
 * @param className
 */
export const toSnakeCase = (className: string | Record<string, unknown>): string => {
    if ('object' === typeof className) {
        className = className.constructor.name;
    }

    return snakeCase(className.toString().replace(/Handler$/, ''));
};
