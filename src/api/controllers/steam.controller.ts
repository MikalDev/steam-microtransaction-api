import constants from '@src/constants';
import { ISteamOpenTransaction, ISteamTransaction } from '@src/steam/steaminterfaces';
import { Request, Response, NextFunction } from 'express';

import { parseEncryptedAppTicket } from 'steam-appticket';

// Improving type annotations for errors and response objects
interface CustomError extends Error {
  response?: {
    status?: number;
    error?: {
      errordesc?: string;
    };
  };
}

const validateError = (res: Response, err: CustomError): void => {
  const status = err?.response?.status ?? 400;

  if (status === 403) {
    res.status(403).json({ error: 'Invalid Steam WebKey' });
    return;
  }

  res.status(status).json({ error: err.message || 'Something went wrong' });
};

function generateOrderId(): string {
  const timestamp = BigInt(Date.now());
  // Use 22 bits for random to get better uniqueness
  const random = BigInt(crypto.getRandomValues(new Uint32Array(1))[0] & 0x3FFFFF);
  // Shift timestamp left by 22 bits and combine with random
  const orderId = (timestamp << 22n) | random;
  return orderId.toString();
}

export default {
  getReliableUserInfo: async (req: Request, res: Response): Promise<void> => {
    const { steamId } = req.body;
    if (!steamId) {
      res.status(400).json({ error: 'Invalid steamId' });
      return;
    }

    try {
      const data = await req.steam.steamMicrotransactionGetUserInfo(steamId);

      const success =
        data.response.result === 'OK' &&
        (data.response.params.status === 'Active' || data.response.params.status === 'Trusted');

      if (!success) {
        throw new Error(data.response?.error?.errordesc ?? 'Steam API returned unknown error');
      }

      res.status(200).json({ success, ...data.response.params });
    } catch (err) {
      validateError(res, err as CustomError);
    }
  },

  checkAppOwnership: async (req: Request, res: Response): Promise<void> => {
    const { steamId, appId } = req.body;

    if (!appId || !steamId) {
      res.status(400).json({ error: 'Missing fields steamId or appId' });
      return;
    }

    try {
      const data = await req.steam.steamCheckAppOwnership({ appId, steamId });

      const success = data.appownership.result === 'OK' && data.appownership.ownsapp;

      if (!success) {
        throw new Error('The specified steamId has not purchased the provided appId');
      }

      res.status(200).json({ success });
    } catch (err) {
      validateError(res, err as CustomError);
    }
  },

  initPurchase: async (req: Request, res: Response): Promise<void> => {
    const { appId, itemId, steamId }: ISteamOpenTransaction =
      req.body;

    let {orderId}: ISteamOpenTransaction = req.body;

    // client cannot create a trusted orderId, so server needs to generate one
    // this orderId can be used to check the purchase status
    // it can also be stored in the database to check the purchase status, prevent double purchases, etc.
    orderId = generateOrderId();

    const product = constants.products.find(p => p.itemdefid.toString() == itemId);

    if (!product) {
      res.status(400).json({ error: 'ItemId not found in the game database' });
      return;
    }

    try {
      const data = await req.steam.steamMicrotransactionInitWithOneItem({
        category: product.category,
        appId,
        amount: product.price_usd,
        itemDescription: product.name,
        itemId,
        orderId,
        steamId,
      });

      const success = data.response.result === 'OK' && data.response.params.transid;

      if (!success) {
        throw new Error(data.response?.error?.errordesc ?? 'Steam API returned unknown error');
      }

      res.status(200).json({ transid: data.response.params.transid });
    } catch (err) {
      validateError(res, err as CustomError);
    }
  },

  checkPurchaseStatus: async (req: Request, res: Response): Promise<void> => {
    const { appId, orderId, transId }: ISteamTransaction = req.body;

    if (!appId || !orderId || !transId) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    try {
      const data = await req.steam.steamMicrotransactionCheckRequest({ appId, orderId, transId });

      if (data.response?.result !== 'OK') {
        throw new Error(data.response?.error?.errordesc ?? 'Steam API returned unknown error');
      }

      res.status(200).json({ success: true, ...data.response.params });
    } catch (err) {
      validateError(res, err as CustomError);
    }
  },

  finalizePurchase: async (req: Request, res: Response): Promise<void> => {
    const { orderId, appId } = req.body;

    if (!orderId || !appId) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    try {
      const data = await req.steam.steamMicrotransactionFinalizeTransaction(appId, orderId);

      console.debug("finalizePurchase:\n", data);
      res.status(200).json({
        success: data.response.result === 'OK',
        ...(data.response?.error ? { error: data.response?.error?.errordesc } : {}),
      });
    } catch (err) {
      validateError(res, err as CustomError);
    }
  },

  validateAppTicket: (req: Request, res: Response, next: NextFunction) => {
    const appTicket = req.header('x-steam-app-ticket');
    const decryptionKey = process.env.STEAM_APP_TICKET_KEY;
  
    if (!appTicket) {
      res.status(400).json({ error: 'Missing x-steam-app-ticket header' });
      return;
    }
  
    if (!decryptionKey) {
      res.status(500).json({ error: 'Steam app decryption key not configured' });
      return;
    }
  
    try {
      const ticket = Buffer.from(appTicket, 'base64');
      const ticketData = parseEncryptedAppTicket(ticket, decryptionKey);
  
      if (!ticketData) {
        res.status(401).json({ error: 'Invalid app ticket' });
        return;
      }
  
      if (ticketData.appID !== parseInt(process.env.STEAM_APP_ID)) {
        res.status(401).json({ error: 'App ticket is for wrong application' });
        return;
      }
  
      const steamAppTicketTimeout = parseInt(process.env.STEAM_APP_TICKET_TIMEOUT || '0');
      if (Date.now() - ticketData.ownershipTicketGenerated.getTime() > steamAppTicketTimeout) {
        res.status(401).json({ error: 'App ticket has expired' });
        return;
      }
  
      next();
    } catch (error) {
      res.status(401).json({ error: 'Failed to validate app ticket' });
      return;
    }
  },
};
