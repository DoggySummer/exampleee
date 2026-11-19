import { LoginPage } from "@/app/_components/auth/AuthPages";

export default function Page({ searchParams }: PageProps<"/owner/login">) {
  return <LoginPage role="owner" searchParams={searchParams} />;
}
