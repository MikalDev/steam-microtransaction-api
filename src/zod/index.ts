import { z } from 'zod';
import { RequestHandler } from 'express';

// Common field schemas
const steamIdSchema = z.string().nonempty('SteamID is required').max(64, 'SteamID too long');
const appIdSchema = z.string().nonempty('AppID is required').max(64, 'AppID too long');
const orderIdSchema = z.string().nonempty('Order ID is required').max(64, 'Order ID too long');
const transIdSchema = z.string().nonempty('Transaction ID is required').max(64, 'Transaction ID too long');
const itemIdSchema = z.number().positive('Item ID must be positive');
const categorySchema = z.string().nonempty('Category is required').max(64, 'Category too long');
const itemDescSchema = z.string().max(1024, 'Description too long');

// Header schemas
const baseHeadersSchema = z.object({
  'content-type': z.literal('application/json')
});

const appTicketHeadersSchema = baseHeadersSchema.extend({
  'x-steam-app-ticket': z.string().nonempty('App ticket is required')
});

// Route schemas
export const routeSchemas = {
  getReliableUserInfo: z.object({
    headers: baseHeadersSchema,
    body: z.object({
      steamId: steamIdSchema,
    })
  }),

  checkAppOwnership: z.object({
    headers: baseHeadersSchema,
    body: z.object({
      steamId: steamIdSchema,
      appId: appIdSchema
    })
  }),

  initPurchaseAppTicket: z.object({
    headers: appTicketHeadersSchema,
    body: z.object({
      appId: appIdSchema,
      itemId: itemIdSchema,
      itemDescription: itemDescSchema,
      category: categorySchema,
      steamId: steamIdSchema
    })
  }),

  initPurchase: z.object({
    headers: baseHeadersSchema,
    body: z.object({
      appId: appIdSchema,
      itemId: itemIdSchema,
      itemDescription: itemDescSchema,
      category: categorySchema,
      steamId: steamIdSchema
    })
  }),


  finalizePurchaseAppTicket: z.object({
    headers: appTicketHeadersSchema,
    body: z.object({
      appId: appIdSchema,
      orderId: orderIdSchema
    })
  }),

  finalizePurchase: z.object({
    headers: baseHeadersSchema,
    body: z.object({
      appId: appIdSchema,
      orderId: orderIdSchema
    })
  }),

  checkPurchaseStatus: z.object({
    headers: baseHeadersSchema,
    body: z.object({
      appId: appIdSchema,
      orderId: orderIdSchema,
      transId: transIdSchema
    })
  })
};

// Type exports for TypeScript
export type ValidatedRequest<T extends z.ZodType> = Request & { validatedData: z.infer<T> };

// Validation middleware
export const validateRequest = <T extends z.ZodType>(schema: T): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse({
      headers: req.headers,
      body: req.body
    });
    
    if (result.success) {
      (req as unknown as ValidatedRequest<T>).validatedData = result.data;
      return next();
    }

    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  };
};

// Type exports for TypeScript
export type RouteSchemas = typeof routeSchemas;
