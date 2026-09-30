import type { Metadata } from "next";
import ConversationLanding from "./ConversationLanding";

export const metadata: Metadata = {
  title: "C안 랜딩 | GROVE",
  description: "GROVE 홈페이지 C안 랜딩페이지",
};

export default function CVariantPage() {
  return <ConversationLanding />;
}
