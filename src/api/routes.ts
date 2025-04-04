import steamController from './controllers/steam.controller.js';
import { Express, Router, Request, Response, NextFunction } from 'express';
import { validateRequest, routeSchemas } from '../zod/index.js';
import constants from '../constants.js';

export default (app: Express): void => {
  const router = Router();

  // Add URL logging middleware
  router.use((req, res, next) => {
    if (constants.development) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  /**
   *
   * @api {get} / Initial route to check API Status
   * @apiName Health
   * @apiGroup Status
   * @apiVersion  1.0.0
   *
   * @apiSuccess (Response: 200) {Boolean} success returns true if everything is ok
   *
   * @apiSuccessExample {Object} Success-Response:
   * HTTP/1.1 200
   * {
   *     status : boolean
   * }
   */
  router.get('/', (_req, res) => {
    res.status(200).json({ status: true, message: `API is running ${constants.development ? 'in development mode' : 'in production mode'} ${new Date().toLocaleString()}` });
  });

  /**
   *
   * @api {post} /GetReliableUserInfo Get Reliable User Info
   * @apiName GetReliableUserInfo
   * @apiGroup Microtransaction
   * @apiVersion  1.0.0
   * @apiDescription Check if the user is reliable to start purchase. Return true if user is reliable

   * @apiHeader {String} content-type application/json *required
   *
   * @apiBody {String} steamId User Steam ID
   * @apiBody {String} appId Steam App/Game ID
   *
   * @apiSuccess (Response: 200) {Boolean} success Response Status
   *
   * @apiSuccessExample {Object} Success-Response:
   * HTTP/1.1 200
   * {
   *     success : true,
   * }
   * 
   * @apiError (400) {Object} ValidationError Invalid request parameters
   * @apiErrorExample {json} Validation Error:
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Validation failed",
   *   "details": [
   *     { "field": "body.steamId", "message": "Steam ID is required" },
   *     { "field": "body.appId", "message": "App ID is required" }
   *   ]
   * }
   */
  router.post(
    '/GetReliableUserInfo',
    validateRequest(routeSchemas.getReliableUserInfo),
    steamController.getReliableUserInfo
  );

  /**
   *
   * @api {post} /CheckAppOwnership Check if the user really owns the AppId
   * @apiName CheckAppOwnership
   * @apiGroup Microtransaction
   * @apiVersion  1.0.0
   * @apiDescription Return success:true if the user owns the app. Useful to prevent purchase from non-owners

   * @apiHeader {String} content-type application/json *required
   *
   * @apiBody {String} steamId User Steam ID
   * @apiBody {String} appId Steam App/Game ID
   *
   * @apiSuccess (Response: 200) {Boolean} success Response Status
   *
   * @apiSuccessExample {Object} Success-Response:
   * HTTP/1.1 200
   * {
   *     success : true,
   * }
   * 
   * @apiError (400) {Object} ValidationError Invalid request parameters
   * @apiErrorExample {json} Validation Error:
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Validation failed",
   *   "details": [
   *     { "field": "body.steamId", "message": "Steam ID is required" },
   *     { "field": "body.appId", "message": "App ID is required" }
   *   ]
   * }
   */
  router.post(
    '/CheckAppOwnership',
    validateRequest(routeSchemas.checkAppOwnership),
    steamController.checkAppOwnership
  );

  /**
   *
   * @api {post} /InitPurchase Init Purchase
   * @apiName InitPurchase
   * @apiGroup Microtransaction
   * @apiVersion  1.0.0
   * @apiDescription Init the purchase process. After this call, the steam will popup a confirmation dialog in the game.

   * @apiHeader {String} content-type application/json *required
   * @apiHeader {String} x-steam-app-ticket Steam App Ticket
   *
   * @apiBody {String} appId string
   * @apiBody {String} orderId number
   * @apiBody {Integer} itemId number
   * @apiBody {String} itemDescription string
   * @apiBody {String} category string
   * @apiBody {String} steamId User Steam ID
   *
   * @apiSuccess (Response: 200) {Boolean} transid Transaction Id
   *
   * @apiParamExample {json} Request-Example:
   * {
   *      appId: '480',
   *      itemId: 1001,
   *      itemDescription: 'abcd',
   *      category: 'gold',
   *      steamID: '765443152131231231',
   * }
   *
   * @apiSuccessExample {Object} Success-Response:
   * HTTP/1.1 200
   * {
   *     transid : "asdfglorenid",
   * }
   * 
   * @apiError (400) {Object} ValidationError Invalid request parameters
   * @apiErrorExample {json} Validation Error:
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Validation failed",
   *   "details": [
   *     { "field": "headers.x-steam-app-ticket", "message": "App ticket is required" },
   *     { "field": "body.orderId", "message": "Invalid Order ID format" },
   *     { "field": "body.itemId", "message": "Item ID must be positive" },
   *     { "field": "body.itemDescription", "message": "Description too long" },
   *     { "field": "body.category", "message": "Invalid enum value" }
   *   ]
   * }
   */
  router.post(
    '/InitPurchase',
    validateRequest(routeSchemas.initPurchase),
    steamController.initPurchase
  );

  router.post(
    '/InitPurchaseAppTicket',
    steamController.validateAppTicket,
    validateRequest(routeSchemas.initPurchaseAppTicket),
    steamController.initPurchase
  );

  /**
   *
   * @api {post} /FinalizePurchase Finalize Purchase
   * @apiName FinalizePurchase
   * @apiGroup Microtransaction
   * @apiVersion  1.0.0
   * @apiDescription Finalize the transaction. See https://partner.steamgames.com/doc/webapi/ISteamMicroTxn#FinalizeTxn

   * @apiHeader {String} content-type application/json *required
   * @apiHeader {String} x-steam-app-ticket Steam App Ticket
   *
   * @apiBody {String} appId Steam App Id
   * @apiBody {String} orderId Order Id from client authorization
   *
   * @apiSuccess (Response: 200) {Boolean} success Return true if the transaction was finished successfully
   *
   * @apiSuccessExample {Object} Success-Response:
   * HTTP/1.1 200
   * {
   *     success : true,
   * }
   * 
   * @apiError (400) {Object} ValidationError Invalid request parameters
   * @apiErrorExample {json} Validation Error:
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Validation failed",
   *   "details": [
   *     { "field": "headers.x-steam-app-ticket", "message": "App ticket is required" },
   *     { "field": "body.orderId", "message": "Invalid Order ID format" }
   *   ]
   * }
   */
  router.post(
    '/FinalizePurchase',
    validateRequest(routeSchemas.finalizePurchase),
    steamController.finalizePurchase
  );

  router.post(
    '/FinalizePurchaseAppTicket',
    steamController.validateAppTicket,
    validateRequest(routeSchemas.finalizePurchaseAppTicket),
    steamController.finalizePurchase
  );

  /**
   *
   * @api {post} /CheckPurchaseStatus Check Purchase Status
   * @apiName CheckPurchaseStatus
   * @apiGroup Microtransaction
   * @apiVersion  1.0.0
   * @apiDescription Retrieve the current status of the purchase

   * @apiHeader {String} content-type application/json *required
   *
   * @apiBody {String} appId Steam App Id
   * @apiBody {String} orderId Order Id
   * @apiBody {String} transId Transaction Id
   *
   * @apiSuccess (Response: 200) {Boolean} success
   * @apiSuccess (Response: 200) {Json} fields Retrieve Transaction Data
   *
   * @apiSuccessExample {Object} Success-Response:
   * HTTP/1.1 200
   * {
   *     success : true,
   *     orderid : string,
   *     transid : string,
   *     steamid : string,
   *     status : string,
   *     currency: string
   *     time: string,
   *     country: string,
   *     usstate: string,
   *     items: [{
   *          itemid : string,
   *          qty : number,
   *          amount : string,
   *          vat : string,
   *          itemstatus : string,
   *     }]
   * }
   * 
   * @apiError (400) {Object} ValidationError Invalid request parameters
   * @apiErrorExample {json} Validation Error:
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Validation failed",
   *   "details": [
   *     { "field": "body.orderId", "message": "Invalid Order ID format" },
   *     { "field": "body.transId", "message": "Transaction ID is required" }
   *   ]
   * }
   */
  router.post(
    '/checkPurchaseStatus',
    validateRequest(routeSchemas.checkPurchaseStatus),
    steamController.checkPurchaseStatus
  );

  // Add router to the application
  app.use('/', router);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: 500,
      message: err.message || 'Something went wrong',
      stack: constants.development ? err.stack : undefined,
    });
  });

  // 404 handling for unknown routes
  app.use((_req, res) => {
    res.status(404).send('Not found txn route');
  });
};
