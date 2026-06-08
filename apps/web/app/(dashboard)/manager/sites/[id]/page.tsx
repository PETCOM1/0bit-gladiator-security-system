import SiteDetailsView from "@/features/manager/components/SiteDetailsView";

export default function ManagerSiteDetailsPage({ params }: { params: { id: string } }) {
  return <SiteDetailsView siteId={params.id} />;
}
