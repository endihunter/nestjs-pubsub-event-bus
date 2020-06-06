export interface ICqrsModuleOptions {
    connections: string[];

    /**
     * If "true", registers `CqrsModule` as a global module.
     * See: https://docs.nestjs.com/modules#global-modules
     */
    isGlobal?: boolean;
}
