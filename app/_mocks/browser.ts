import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { customerHandlers } from "./handlers/customer";

export const worker = setupWorker(...authHandlers, ...customerHandlers);
