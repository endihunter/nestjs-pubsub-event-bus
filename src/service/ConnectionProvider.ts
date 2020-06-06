export class ConnectionProvider {
    static connections: string[] = [];

    constructor(hosts: string[]) {
        ConnectionProvider.connections = hosts;
    }
}
