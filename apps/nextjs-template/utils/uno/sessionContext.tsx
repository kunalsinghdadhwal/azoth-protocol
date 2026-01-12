"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { generateSecp256k1Keypair } from "@inco/js/lite";
import { privateKeyToAccount } from "viem/accounts";
import { getConfig } from "@/utils/inco";
import { SESSION_VERIFIER_ADDRESS } from "./constants";
import type { HexString } from "@inco/js";

// Types for session key management
interface SessionKeyData {
  keypair: ReturnType<typeof generateSecp256k1Keypair>;
  voucher: unknown;
  expiresAt: Date;
}

interface SessionKeyContextValue {
  // Session state
  sessionKey: SessionKeyData | null;
  isCreatingSession: boolean;
  sessionError: string | null;

  // Session actions
  createSession: () => Promise<boolean>;
  revokeSession: () => Promise<void>;
  isSessionValid: () => boolean;

  // Decryption with session key
  decryptWithSession: (handles: HexString[]) => Promise<bigint[]>;
}

const SessionKeyContext = createContext<SessionKeyContextValue | null>(null);

// Session duration: 1 hour
const SESSION_DURATION_MS = 1000 * 60 * 60;

export function SessionKeyProvider({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [sessionKey, setSessionKey] = useState<SessionKeyData | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Ref to store the Lightning instance with voucher methods
  const zapRef = useRef<Awaited<ReturnType<typeof getConfig>> | null>(null);
  // Track previous wallet to detect disconnection
  const prevWalletRef = useRef(walletClient);

  // Clear session when wallet disconnects
  useEffect(() => {
    if (prevWalletRef.current && !walletClient && sessionKey) {
      console.log("[Session] Wallet disconnected, clearing session");
      setSessionKey(null);
      zapRef.current = null;
    }
    prevWalletRef.current = walletClient;
  }, [walletClient, sessionKey]);

  const isSessionValid = useCallback(() => {
    if (!sessionKey) return false;
    return sessionKey.expiresAt > new Date();
  }, [sessionKey]);

  const createSession = useCallback(async (): Promise<boolean> => {
    if (!walletClient) {
      setSessionError("Wallet not connected");
      return false;
    }

    setIsCreatingSession(true);
    setSessionError(null);

    try {
      console.log("[Session] Creating session key...");

      // Generate ephemeral keypair for the session
      const keypair = generateSecp256k1Keypair();
      const ephemeralAccount = privateKeyToAccount(
        `0x${keypair.kp.getPrivate("hex")}`
      );

      console.log("[Session] Ephemeral address:", ephemeralAccount.address);

      // Get Lightning instance
      const zap = await getConfig();
      zapRef.current = zap;

      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

      // Grant session key allowance voucher
      // The user signs once here to authorize the ephemeral key
      console.log("[Session] Requesting voucher signature...");

      // Type assertion for the voucher API
      const zapWithVoucher = zap as unknown as {
        grantSessionKeyAllowanceVoucher: (
          walletClient: unknown,
          address: string,
          expiresAt: Date,
          sessionVerifier: string
        ) => Promise<unknown>;
      };

      const voucher = await zapWithVoucher.grantSessionKeyAllowanceVoucher(
        walletClient,
        ephemeralAccount.address,
        expiresAt,
        SESSION_VERIFIER_ADDRESS
      );

      console.log("[Session] Session key created successfully!");
      console.log("[Session] Expires at:", expiresAt.toISOString());

      setSessionKey({
        keypair,
        voucher,
        expiresAt,
      });

      return true;
    } catch (error) {
      console.error("[Session] Failed to create session:", error);
      setSessionError(
        error instanceof Error ? error.message : "Failed to create session key"
      );
      return false;
    } finally {
      setIsCreatingSession(false);
    }
  }, [walletClient]);

  const revokeSession = useCallback(async () => {
    if (!walletClient || !zapRef.current) {
      setSessionKey(null);
      return;
    }

    try {
      console.log("[Session] Revoking session...");

      // Type assertion for the revoke API
      const zapWithRevoke = zapRef.current as unknown as {
        updateActiveVouchersSessionNonce: (
          walletClient: unknown
        ) => Promise<string>;
      };

      await zapWithRevoke.updateActiveVouchersSessionNonce(walletClient);
      console.log("[Session] Session revoked successfully");
    } catch (error) {
      console.error("[Session] Failed to revoke session:", error);
    } finally {
      setSessionKey(null);
      zapRef.current = null;
    }
  }, [walletClient]);

  const decryptWithSession = useCallback(
    async (handles: HexString[]): Promise<bigint[]> => {
      if (!sessionKey || !isSessionValid()) {
        throw new Error("No valid session key. Please create a session first.");
      }

      if (!publicClient) {
        throw new Error("Public client not available");
      }

      if (handles.length === 0) {
        return [];
      }

      try {
        console.log(
          "[Session] Decrypting",
          handles.length,
          "handles with session key..."
        );

        const zap = zapRef.current || (await getConfig());

        // Type assertion for the voucher decrypt API
        const zapWithVoucherDecrypt = zap as unknown as {
          attestedDecryptWithVoucher: (
            keypair: ReturnType<typeof generateSecp256k1Keypair>,
            voucher: unknown,
            publicClient: unknown,
            handles: HexString[]
          ) => Promise<Array<{ plaintext: { value: bigint } }>>;
        };

        const results = await zapWithVoucherDecrypt.attestedDecryptWithVoucher(
          sessionKey.keypair,
          sessionKey.voucher,
          publicClient,
          handles
        );

        const values = results.map((r) => r.plaintext.value);
        console.log("[Session] Decrypted", values.length, "values successfully");

        return values;
      } catch (error) {
        console.error("[Session] Decryption with session failed:", error);
        throw error;
      }
    },
    [sessionKey, isSessionValid, publicClient]
  );

  return (
    <SessionKeyContext.Provider
      value={{
        sessionKey,
        isCreatingSession,
        sessionError,
        createSession,
        revokeSession,
        isSessionValid,
        decryptWithSession,
      }}
    >
      {children}
    </SessionKeyContext.Provider>
  );
}

export function useSessionKeyContext() {
  const context = useContext(SessionKeyContext);
  if (!context) {
    throw new Error(
      "useSessionKeyContext must be used within a SessionKeyProvider"
    );
  }
  return context;
}
