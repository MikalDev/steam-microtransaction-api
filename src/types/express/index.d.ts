import { Request } from 'express';
import { z } from 'zod';

declare module 'express' {
  interface Request {
    ticketData?: {
      version: number;
      steamID: string;
      appID: number;
      ownershipTicketExternalIP: string;
      ownershipTicketInternalIP: string;
      ownershipFlags: number;
      ownershipTicketGenerated: Date;
      licenses: number[];
      dlc: Array<{
        appID: number;
        licenses: number[];
      }>;
      userData: any;
    };
    validatedData?: z.infer<z.ZodSchema>;
  }
} 