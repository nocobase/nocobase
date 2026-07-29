import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthenticatorSignIn } from "@/components/auth";
import type { Authenticator } from "@/components/auth/types";
import { nocobaseClient } from "@/lib/nocobase/client";

type SmsCodeResponse = {
  expiresAt?: string;
};

export function useSmsSignIn(authenticator: Authenticator) {
  const auth = useAuthenticatorSignIn(authenticator.name);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [sendError, setSendError] = useState<Error>();
  const [expiresAt, setExpiresAt] = useState<number>();
  const [now, setNow] = useState(Date.now());
  const verifier =
    typeof authenticator.options?.verifier === "string"
      ? authenticator.options.verifier
      : "";

  useEffect(() => {
    if (!expiresAt || expiresAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const retryAfter = useMemo(
    () =>
      expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1_000)) : 0,
    [expiresAt, now]
  );

  const sendCode = useCallback(
    async (phone: string) => {
      if (!phone) throw new Error("Enter a phone number first.");
      if (!verifier) {
        throw new Error("The SMS verifier is not configured.");
      }
      if (retryAfter > 0) return;

      setSendError(undefined);
      setIsSendingCode(true);
      try {
        const result = await nocobaseClient.action<SmsCodeResponse>(
          "smsOTP",
          "publicCreate",
          {
            method: "POST",
            authenticator: null,
            includeRole: false,
            withAclMeta: false,
            body: {
              action: "auth:signIn",
              verifier,
              uuid: phone,
            },
          }
        );
        const nextExpiry = result?.expiresAt
          ? Date.parse(result.expiresAt)
          : Date.now() + 60_000;
        setNow(Date.now());
        setExpiresAt(nextExpiry);
      } catch (cause) {
        const error =
          cause instanceof Error
            ? cause
            : new Error("Unable to send the verification code.");
        setSendError(error);
        throw error;
      } finally {
        setIsSendingCode(false);
      }
    },
    [retryAfter, verifier]
  );

  return {
    sendCode,
    signIn: (phone: string, code: string) =>
      auth.signIn({ uuid: phone, code }),
    isSendingCode,
    isSigningIn: auth.isPending,
    retryAfter,
    error: sendError ?? auth.error,
  };
}
