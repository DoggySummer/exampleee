import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { customerHandlers } from "./handlers/customer";
import { ownerHandlers } from "./handlers/owner";

export const worker = setupWorker(...authHandlers, ...customerHandlers, ...ownerHandlers);
