import controllers from '../src/api/controllers/steam.controller.js';
import { getMockReq, getMockRes } from '@jest-mock/express';

import { MockedRequestWithSteam, mockSteamApiPost, mockedSteamRequest } from './utils.js';

import finalizePurchaseSuccessMock from './mock/micro-tx-finalize-transaction-success-mock.json' assert { type: 'json' };

describe('Controller Test: /FinalizePurchase', () => {
  it('Should return success confirming that the transaction is completed', async () => {
    mockSteamApiPost.mockReturnValueOnce(Promise.resolve(finalizePurchaseSuccessMock));

    const req = getMockReq<MockedRequestWithSteam>({
      steam: mockedSteamRequest,
      body: {
        orderId: 'FAKE-ORDER-ID',
        appId: '480',
      },
    });
    const { res } = getMockRes();
    await controllers.finalizePurchase(req, res as any);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });
});
