import { Request, Response, NextFunction } from 'express';
import { isValidEquipmentId } from '../data/trustedEquipment.js';

export function validateChatRequest(req: Request, res: Response, next: NextFunction): void {
  const { message, sessionId, equipmentId, history } = req.body;

  // Validate message
  if (!message || typeof message !== 'string') {
    res.status(400).json({
      error: 'Invalid request: "message" is required and must be a string.',
      code: 'MISSING_MESSAGE'
    });
    return;
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    res.status(400).json({
      error: 'Invalid request: "message" cannot be empty.',
      code: 'EMPTY_MESSAGE'
    });
    return;
  }

  if (trimmedMessage.length > 2500) {
    res.status(400).json({
      error: 'Invalid request: "message" exceeds maximum allowed length of 2500 characters.',
      code: 'MESSAGE_TOO_LONG'
    });
    return;
  }

  // Validate sessionId if provided
  if (sessionId !== undefined && sessionId !== null) {
    if (typeof sessionId !== 'string' || sessionId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      res.status(400).json({
        error: 'Invalid request: "sessionId" must be an alphanumeric string up to 128 characters.',
        code: 'INVALID_SESSION_ID'
      });
      return;
    }
  }

  // Validate equipmentId if provided
  if (equipmentId !== undefined && equipmentId !== null && equipmentId !== '') {
    if (typeof equipmentId !== 'string' || equipmentId.length > 64) {
      res.status(400).json({
        error: 'Invalid request: "equipmentId" must be a string up to 64 characters.',
        code: 'INVALID_EQUIPMENT_ID'
      });
      return;
    }
    // We check if it is a known instrument; if not, we do not reject, but sanitize
  }

  // Validate history if provided
  if (history !== undefined && history !== null) {
    if (!Array.isArray(history) || history.length > 50) {
      res.status(400).json({
        error: 'Invalid request: "history" must be an array with at most 50 messages.',
        code: 'INVALID_HISTORY'
      });
      return;
    }
  }

  req.body.message = trimmedMessage;
  next();
}
