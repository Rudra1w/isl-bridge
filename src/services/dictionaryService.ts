import { SignAssetRegistryService } from '@/modules/sign-output/SignAssetRegistry';
import { SignAsset } from '@/types/isl';

export class DictionaryService {
  public static getAllSigns(): SignAsset[] {
    return SignAssetRegistryService.getAllAssets();
  }

  public static getSign(token: string): SignAsset | undefined {
    return SignAssetRegistryService.getAsset(token);
  }

  public static searchSigns(query: string): SignAsset[] {
    return SignAssetRegistryService.searchAssets(query);
  }

  public static getCategories(): string[] {
    const assets = this.getAllSigns();
    const categories = new Set<string>();
    assets.forEach((a) => {
      if (a.category) categories.add(a.category);
    });
    return Array.from(categories);
  }

  public static getSignsByCategory(category: SignAsset['category']): SignAsset[] {
    return SignAssetRegistryService.getAssetsByCategory(category);
  }
}
