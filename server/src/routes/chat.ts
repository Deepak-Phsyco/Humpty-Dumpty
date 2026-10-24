import { Router, Request, Response, NextFunction } from 'express';
import { harnessService } from '../harness/harnessService.js';
import { validateChatRequest } from '../middleware/validator.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config.js';

export const chatRouter = Router();

chatRouter.post(
  '/chat',
  chatRateLimiter,
  validateChatRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    // Request timeout guard
    let isSettled = false;
    const timeoutHandle = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        res.status(504).json({
          error: 'The DeepSeek Harness runtime request timed out. Please try asking a more specific question.',
          code: 'GATEWAY_TIMEOUT'
        });
      }
    }, config.requestTimeoutMs);

    try {
      const response = await harnessService.sendMessage({
        message: req.body.message,
        sessionId: req.body.sessionId,
        equipmentId: req.body.equipmentId,
        history: req.body.history,
      });

      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutHandle);
        res.status(200).json(response);
      }
    } catch (err: any) {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutHandle);
        next(err);
      }
    }
  }
);
