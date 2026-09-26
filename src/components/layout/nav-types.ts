export interface NavData {
  categories: { id: string; slug: string; name: string; parentId: string | null }[];
  collections: { slug: string; name: string; kicker: string; heroImage: string }[];
  feature: { image: string };
}
