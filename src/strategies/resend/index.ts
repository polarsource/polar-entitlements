import { type CreateEmailOptions, Resend } from "resend";
import { EntitlementStrategy } from "../..";

export type SendEmailOptions = {
  slug: string;
  accessToken: string;
} & Omit<CreateEmailOptions, "to">;

export const sendEmail = (options: SendEmailOptions) => {
  const { accessToken, slug, ...createOptions } = options;

  return new EntitlementStrategy({
    slug,
    grant: async (context) => {
      const resend = new Resend(accessToken);

      await resend.emails.send({
        ...(createOptions as CreateEmailOptions),
        to: context.customer.email,
      });
    },
  });
};
