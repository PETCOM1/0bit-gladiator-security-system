import SiteDetailsView from "@/features/manager/components/SiteDetailsView";

export default async function ManagerSiteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteDetailsView siteId={id} />;
}
