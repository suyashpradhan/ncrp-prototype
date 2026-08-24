import type { Metadata } from "next";
import { DemoLogin } from "../../components/demo-auth/demo-login";

export const metadata: Metadata = {
  title: "Demo login",
};

export default function LoginPage() {
  return <DemoLogin />;
}
