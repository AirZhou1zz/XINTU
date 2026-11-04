import { redirect } from "next/navigation";

type StudioPageProps = {
  searchParams: Promise<{ preset?: string | string[] }>;
};

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const params = await searchParams;
  const rawPreset = Array.isArray(params.preset) ? params.preset[0] : params.preset;
  redirect(rawPreset ? `/?preset=${encodeURIComponent(rawPreset)}` : "/");
}