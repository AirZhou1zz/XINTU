import { XintuProduct } from "@/components/xintu/xintu-product";

type HomePageProps = {
  searchParams: Promise<{ preset?: string | string[] }>;
};

const presets = ["custom", "portrait", "landscape", "film"] as const;
type Preset = (typeof presets)[number];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const rawPreset = Array.isArray(params.preset) ? params.preset[0] : params.preset;
  const initialPreset: Preset = rawPreset && presets.includes(rawPreset as Preset)
    ? rawPreset as Preset
    : "custom";

  return <XintuProduct initialPreset={initialPreset} />;
}