"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Sites has been merged into the Operations page.
// Redirect so any bookmarked /manager/sites links still work.
export default function SitesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/manager/operations"); }, [router]);
  return null;
}
