import { UnoGame } from "@/components/uno";
import { SessionKeyProvider } from "@/utils/uno/sessionContext";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Confidential UNO | Azoth Protocol",
  description: "Play UNO with encrypted cards on the blockchain using Inco fhEVM",
};

export default function UnoPage() {
  return (
    <SessionKeyProvider>
      <UnoGame />
    </SessionKeyProvider>
  );
}
