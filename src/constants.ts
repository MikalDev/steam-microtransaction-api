import steamProducts from './products.json' assert { type: 'json' };

export interface SteamProduct {
  itemdefid: number;
  type: 'bundle' | 'item';
  name: string;
  description: string;
  display_type: string;
  background_color: string;
  name_color: string;
  icon_url: string;
  icon_url_large: string;
  marketable: boolean;
  tradable: boolean;
  auto_stack: boolean;
  category: string;
  gold_quantity: number;
  // Optional fields (only present on bundles)
  price_category?: string;
  price_usd?: number;
  bundle?: string;
  store_tags?: string;
  store_images?: string;
  hidden?: boolean;
  store_hidden?: boolean;
  granted_manually?: boolean;
}

const products: SteamProduct[] = steamProducts.items as SteamProduct[];

export default {
  /**
   *  Don't forget to generate your own steam webkey
   *  To generate the proper key, you need to implement the WebAPIKey from
   *  Steam Developer Page, User&Permissions -> Manage Group -> (Your App's name)
   */
  webkey: process.env.STEAM_WEBKEY,
  /**
   *  Define the list of products to be used by the transaction system to prevent users to send lower or higher price
   *  for these products.
   */
  products,
  /**
   * Useful during transaction creation
   * Steam automatically converts from this currency to the user local currency.
   * But you can change as you please.
   * See https://partner.steamgames.com/doc/store/pricing/currencies
   */
  currency: process.env.STEAM_CURRENCY || 'USD',
  /**
   * Used to define the locale of the item
   */
  locale: process.env.STEAM_ITEM_LOCALE || 'en',
  /**
   * Set true if you want to enable sandbox mode
   * Please check https://partner.steamgames.com/doc/webapi/ISteamMicroTxnSandbox for more info
   */
  development: process.env.NODE_ENV == 'test' || process.env.NODE_ENV === 'development',
};
