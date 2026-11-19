import { LoginPage } from "@/app/_components/auth/AuthPages";

export default function Page({ searchParams }: PageProps<"/rider/login">) {
  return <LoginPage role="rider" searchParams={searchParams} />;
}
