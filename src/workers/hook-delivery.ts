import { HOOK_RETRY, WEBHOOK_DELIVERY_TIMEOUT } from "../constants";
import { Environment, HookDelivery, MessageBody } from "../types";
import { fetchWithTimeout, getHeaders } from "../utils";

export const hookDelivery = async (message: MessageBody, env: Environment) => {
	// Send new payments to the webhook making a POST with json data

	const { invoice, payment, service, hook, hook_type } = message;

	if (!payment) {
		throw new Error("Missing payment");
	}

	if (!hook) {
		throw new Error("Missing hook");
	}

	if (!hook_type) {
		throw new Error("Missing hook_type");
	}

	try {
		const started_at = new Date().toISOString();

		const requestHeaders = {
			"Content-Type": "application/json",
			...hook.headers
		};

		const requestBody = {
			type: hook_type,
			invoice,
			service,
			payment
		};

		const response = await fetchWithTimeout(hook.url, {
			method: "POST",
			headers: requestHeaders,
			body: requestBody,
			timeout: WEBHOOK_DELIVERY_TIMEOUT
		});

		const response_body = await response.text();

		const completed_at = new Date().toISOString();

		const response_headers = getHeaders(response.headers);

		// Send the payment to the worker write to the db
		await env.HOOK_DELIVERY_WRITE_QUEUE.send({
			invoice,
			hook_delivery: {
				hook_id: hook.id,
				type: hook_type,
				success: response.ok,
				url: hook.url,
				status_code: response.status,
				request_headers: requestHeaders,
				request_body: requestBody,
				response_headers,
				response_body,
				started_at,
				completed_at,
				redelivery: false
			} as HookDelivery
		});
	} catch (e: any) {
		console.error("Webhook Error", e);
		if (HOOK_RETRY) {
			// Throw so queue automatically retries
			throw new Error(e.message);
		}
	}
};
