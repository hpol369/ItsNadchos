import { Bot } from 'grammy';
export declare const bot: Bot<import("grammy").Context, import("grammy").Api<import("grammy").RawApi>>;
export declare const handleWebhook: (c: {
    req: {
        json: <T>() => Promise<T>;
        header: (header: string) => string | undefined;
    };
    body(data: string): Response;
    body(data: null, status: 204): Response;
    status: (status: any) => void;
    json: (json: string) => Response;
}) => Promise<Response>;
//# sourceMappingURL=bot.d.ts.map