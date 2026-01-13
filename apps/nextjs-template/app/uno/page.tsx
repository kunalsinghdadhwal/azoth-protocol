import { UnoGame } from "@/components/uno";
import { SessionKeyProvider } from "@/utils/uno/sessionContext";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Confidential UNO | Azoth DAO",
  description: "Play UNO with encrypted cards on the blockchain using Inco TEE with public key asymmetric encryption",
};

export default function UnoPage() {
  return (
    <SessionKeyProvider>
      <UnoGame />
    </SessionKeyProvider>
  );
}
