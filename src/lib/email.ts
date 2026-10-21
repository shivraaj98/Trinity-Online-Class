import nodemailer, { type Transporter } from "nodemailer";

let testTransport: Pick<Transporter, "sendMail"> | undefined;

export function __setEmailTransportForTests(transport: Pick<Transporter, "sendMail">): void {
  testTransport = transport;
}

export function __resetEmailTransportForTests(): void {
  testTransport = undefined;
}

export async function sendLoginOtp(email: string, code: string): Promise<void> {
  const server = process.env.EMAIL_SERVER;
  const from = process.env.EMAIL_FROM;
  if (!server || !from) throw new Error("Email delivery is not configured");
  const transport = testTransport ?? nodemailer.createTransport(server);
  await transport.sendMail({
    from,
    to: email,
    subject: "Your Trinity Classes sign-in code",
    text: `Your Trinity Classes sign-in code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
  });
}
