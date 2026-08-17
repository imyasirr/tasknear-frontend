export type ProviderCategoryGroup = {
  id: string
  titleKey: string
  slugs: string[]
}

/** Work types shown per provider (Step 1). Slugs match categories table. */
export const PROVIDER_CATEGORY_GROUPS: Record<string, ProviderCategoryGroup[]> = {
  caterer: [
    {
      id: 'banquet',
      titleKey: 'client.postGroupBanquet',
      slugs: ['waiter', 'helper', 'cleaner', 'cook'],
    },
    {
      id: 'event-extra',
      titleKey: 'client.postGroupEventExtra',
      slugs: ['security', 'decorator'],
    },
  ],
  agency: [
    {
      id: 'event-crew',
      titleKey: 'client.postEventRoles',
      slugs: ['waiter', 'helper', 'cleaner', 'security'],
    },
    {
      id: 'loading',
      titleKey: 'client.postGroupLoading',
      slugs: ['loader', 'task-helper'],
    },
    {
      id: 'setup',
      titleKey: 'client.postGroupEventExtra',
      slugs: ['decorator'],
    },
  ],
  worker: [
    {
      id: 'general',
      titleKey: 'client.postGroupGeneral',
      slugs: ['task-helper', 'loader'],
    },
    {
      id: 'event-service',
      titleKey: 'client.postGroupEventService',
      slugs: ['waiter', 'helper', 'cleaner'],
    },
  ],
  driver: [
    {
      id: 'transport',
      titleKey: 'client.postGroupTransport',
      slugs: ['driver', 'delivery-helper'],
    },
    {
      id: 'shifting',
      titleKey: 'client.postGroupShifting',
      slugs: ['loader'],
    },
  ],
  home_pro: [
    {
      id: 'home-repair',
      titleKey: 'client.postHomeRoles',
      slugs: ['electrician', 'plumber'],
    },
  ],
}

export function groupsForProvider(providerType: string): ProviderCategoryGroup[] {
  return PROVIDER_CATEGORY_GROUPS[providerType] || PROVIDER_CATEGORY_GROUPS.caterer
}
