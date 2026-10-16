/**
 * SuperApp-MicroEngine: Core Host Bridge Router
 * Developed by Ghayma LLC (New Mexico, USA)
 */

export interface MiniAppManifest {
    appId: string;
    bundleUrl: string;
    allowedPermissions: string[];
}

export interface BridgeRequest<T = any> {
    requestId: string;
    service: string;
    action: string;
    payload: T;
    timestamp: number;
}

export interface BridgeResponse<R = any> {
    requestId: string;
    status: "SUCCESS" | "DENIED" | "FAILED";
    data?: R;
    errorMessage?: string;
}

export class SuperAppContainer {
    private actionsRegistry = new Map<string, (req: BridgeRequest) => Promise<any>>();
    private activeMiniApps = new Set<string>();

    constructor(private options: { hostAppId: string; environment: string; enforceSandboxing: boolean }) {
        console.log(`[SuperApp-MicroEngine] Initialized for host: ${options.hostAppId}`);
    }

    registerBridgeAction(actionName: string, handler: (req: BridgeRequest) => Promise<any>): void {
        this.actionsRegistry.set(actionName, handler);
    }

    async mountMiniApp(manifest: MiniAppManifest): Promise<boolean> {
        console.log(`[SuperApp] Sandboxing and mounting mini-app: ${manifest.appId}`);
        this.activeMiniApps.add(manifest.appId);
        return true;
    }

    async dispatchBridgeRequest(appId: string, request: BridgeRequest): Promise<BridgeResponse> {
        if (!this.activeMiniApps.has(appId)) {
            return {
                requestId: request.requestId,
                status: "DENIED",
                errorMessage: "Mini-app is not mounted."
            };
        }

        const handler = this.actionsRegistry.get(request.action);
        if (!handler) {
            return {
                requestId: request.requestId,
                status: "DENIED",
                errorMessage: `Action ${request.action} is not registered in host sandbox.`
            };
        }

        try {
            const result = await handler(request);
            return {
                requestId: request.requestId,
                status: "SUCCESS",
                data: result
            };
        } catch (err: any) {
            return {
                requestId: request.requestId,
                status: "FAILED",
                errorMessage: err.message
            };
        }
    }
}