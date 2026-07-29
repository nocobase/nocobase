import { AuthMethodDemo } from "@/components/auth/demo/auth-method-demo";
import SmsSignInForm from "./sms-sign-in-form";

const authenticator = {
  name: "company-sms",
  authType: "SMS",
  title: "SMS verification code",
  options: { autoSignup: true, verifier: "login-sms" },
};

export function SmsAuthDemoPage() {
  return (
    <AuthMethodDemo
      authType="SMS"
      methodName="SMS verification code"
      description="Collect a phone number and one-time code while keeping delivery and sign-in bound to the configured verifier."
    >
      <SmsSignInForm
        authenticator={authenticator}
        onSendCode={() => {}}
        onSignIn={() => {}}
      />
    </AuthMethodDemo>
  );
}
