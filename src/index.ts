import type { Customer } from "@polar-sh/sdk/models/components/customer";
import type { WebhookBenefitGrantCreatedPayload } from "@polar-sh/sdk/models/components/webhookbenefitgrantcreatedpayload";
import type { WebhookBenefitGrantRevokedPayload } from "@polar-sh/sdk/models/components/webhookbenefitgrantrevokedpayload";

export type EntitlementProperties = Record<string, string>;

export interface EntitlementGrantContext<
	TProps extends EntitlementProperties = EntitlementProperties,
> {
	customer: Customer;
	properties: TProps;
	payload: WebhookBenefitGrantCreatedPayload;
}

export interface EntitlementRevokeContext<
	TProps extends EntitlementProperties = EntitlementProperties,
> {
	customer: Customer;
	properties: TProps;
	payload: WebhookBenefitGrantRevokedPayload;
}

export type EntitlementStrategyOptions = {
	slug: string;
	grant: <TContext extends EntitlementGrantContext>(
		context: TContext,
	) => Promise<void>;
	revoke?: <TContext extends EntitlementRevokeContext>(
		context: TContext,
	) => Promise<void>;
};

export class EntitlementStrategy<
	TOptions extends EntitlementStrategyOptions = EntitlementStrategyOptions,
> {
	slug: string;
	grant: TOptions["grant"];
	revoke: TOptions["revoke"];

	constructor(options: EntitlementStrategyOptions) {
		this.slug = options.slug;
		this.grant = options.grant;
		this.revoke = options.revoke;
	}

	public async handler(
		payload:
			| WebhookBenefitGrantCreatedPayload
			| WebhookBenefitGrantRevokedPayload,
	) {
		if (payload.data.benefit.description === this.slug) {
			switch (payload.type) {
				case "benefit_grant.created":
					this.grant({
						customer: payload.data.customer,
						properties: payload.data.properties as EntitlementProperties,
						payload,
					});
					break;
				case "benefit_grant.revoked":
					this.revoke?.({
						customer: payload.data.customer,
						properties: payload.data.properties as EntitlementProperties,
						payload,
					});
					break;
			}
		}
	}
}

export const Entitlements = {
	use: <TStrategies extends EntitlementStrategy[]>(
		...strategies: TStrategies
	) => {
		return (
			payload:
				| WebhookBenefitGrantCreatedPayload
				| WebhookBenefitGrantRevokedPayload,
		) => Promise.all(strategies.map((strategy) => strategy.handler(payload)));
	},
};
