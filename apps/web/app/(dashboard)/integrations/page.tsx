import React from 'react'
import { IntegrationsView } from '@/modules/integrations/ui/views/integrations-view'
import { Protect } from '@clerk/nextjs'
import { PremiumFeatureOverlay } from '@/modules/billing/ui/components/premium-feature-overlay'

export default function Page() {
  return (
    <Protect
      condition={(has) => has({ plan: "pro" })}
      fallback={
        <PremiumFeatureOverlay>
          <IntegrationsView />
        </PremiumFeatureOverlay>}
    >
      <IntegrationsView />
    </Protect>
  )
}
