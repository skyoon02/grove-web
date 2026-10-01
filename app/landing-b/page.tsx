import type { Metadata } from "next";
import ConversationLanding from "./ConversationLanding";

export const metadata: Metadata = {
  title: "B안 랜딩 | GROVE",
  description: "GROVE 홈페이지 B안 랜딩페이지",
};

export default function BVariantPage() {
  return <ConversationLanding />;
}
