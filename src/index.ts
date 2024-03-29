import { NotFoundException, UnauthorizedException } from "./responses";
import { Environment } from "./types";

import { queue } from "./queues";
import { createInvoice } from "./api/create-invoice";
import { getInvoice } from "./api/get-invoice";

/*
 * This is the main entry point for your Worker.
 * This code is executed once per request.
 * You can use this to define your request and response handling.
 * Learn more about writing workers at https://developers.cloudflare.com/workers
 */
export default {
	async fetch(request: Request, env: Environment): Promise<Response> {

		// Check authorization
		const authorizationHeader = request.headers.get("Authorization");
		const bearerToken = authorizationHeader?.split(" ")[1];
		const authorized = bearerToken === env.AUTH_TOKEN;
		if (!authorized) {
			return UnauthorizedException();
		}

		// POST /invoices
		if (
			request.method === "POST" &&
			new URL(request.url).pathname === "/invoices"
		) {
			return createInvoice(request, env);
		}

		// GET /invoices/[id]
		if (
			request.method === "GET" &&
			new URL(request.url).pathname.startsWith("/invoices/")
		) {
			return getInvoice(request, env);
		}

		return NotFoundException();
	},
	queue
};
