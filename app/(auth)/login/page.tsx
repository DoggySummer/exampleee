import { LoginPage } from "@/app/_components/auth/AuthPages";

export default function Page({ searchParams }: PageProps<"/login">) {
  return <LoginPage role="customer" searchParams={searchParams} />;
}
