declare module "@mono.co/connect.js" {
  interface MonoConnectCustomer {
    id?: string;
    name?: string;
    email?: string;
    identity?: { type: string; number: string };
  }

  type MonoConnectEventName =
    | "SUCCESS"
    | "OPENED"
    | "ERROR"
    | "INSTITUTION_SELECTED"
    | "AUTH_METHOD_SWITCHED"
    | "EXIT";

  interface MonoConnectOptions {
    key: string;
    scope?: string;
    data?: { customer?: MonoConnectCustomer };
    reference?: string;
    onSuccess: (result: { code?: string; id?: string }) => void;
    onClose?: () => void;
    onLoad?: () => void;
    onEvent?: (eventName: MonoConnectEventName, data: unknown) => void;
  }

  export default class Connect {
    constructor(options: MonoConnectOptions);
    setup(config?: Record<string, unknown>): void;
    open(): void;
    close(): void;
    reauthorise(accountId: string): void;
  }
}