import { configManager } from './appConfig';
import { FeatureFlags } from '@/types/config';

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return configManager.getConfig().features[feature];
};

export const getFeatureFlags = (): FeatureFlags => {
  return configManager.getConfig().features;
};
