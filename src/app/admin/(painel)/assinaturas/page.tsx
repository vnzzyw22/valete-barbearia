import { SubscriptionsManager } from "@/components/admin/subscriptions-manager";
import { pageSubtitleClass, pageTitleClass } from "@/components/admin/theme";
import { getAllPlans, getAllSubscriptions } from "@/lib/supabase/admin-queries";

export default async function AssinaturasPage() {
  const [plans, subscriptions] = await Promise.all([getAllPlans(), getAllSubscriptions()]);

  return (
    <div>
      <h1 className={pageTitleClass}>Assinaturas</h1>
      <p className={pageSubtitleClass}>Quem assina, qual plano e quando renova. Os planos aparecem no site.</p>
      <SubscriptionsManager plans={plans} subscriptions={subscriptions} />
    </div>
  );
}
