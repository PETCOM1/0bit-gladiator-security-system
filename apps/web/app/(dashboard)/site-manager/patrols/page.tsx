import { redirect } from "next/navigation";

export default function Page() {
  redirect("/site-manager/operations?tab=patrols");
}
