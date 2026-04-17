import { PROVIDERS_SEED } from '../data/providersSeed';

export async function getProviders() {
  return PROVIDERS_SEED;
}

export async function getProviderById(providerId) {
  return PROVIDERS_SEED.find((provider) => provider.id === providerId) || null;
}