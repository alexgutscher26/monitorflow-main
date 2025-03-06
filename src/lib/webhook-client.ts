import crypto from 'crypto';

export interface WebhookPayload {
  id: string;
  event: {
    id: string;
    name: string;
    category: string | null;
    fields: Record<string, any>;
    createdAt: string;
  };
  timestamp: string;
  account: {
    id: string;
  };
}

export class WebhookClient {
  /**
   * Generate a signature for a webhook payload
   * @param payload The webhook payload to sign
   * @param secret The webhook secret
   * @returns The signature as a string
   */
  static generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payload).digest('hex');
  }

  /**
   * Verify a webhook signature
   * @param payload The webhook payload
   * @param signature The signature to verify
   * @param secret The webhook secret
   * @returns Whether the signature is valid
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  /**
   * Send a webhook payload to a URL
   * @param url The URL to send the webhook to
   * @param payload The webhook payload
   * @param secret The webhook secret
   * @param headers Additional headers to send
   * @returns The response from the webhook
   */
  static async sendWebhook(
    url: string, 
    payload: WebhookPayload, 
    secret: string,
    headers: Record<string, string> = {}
  ): Promise<{
    success: boolean;
    statusCode?: number;
    responseBody?: string;
    error?: string;
  }> {
    try {
      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString, secret);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MonitorFlow-Signature': signature,
          'User-Agent': 'MonitorFlow-Webhook/1.0',
          ...headers
        },
        body: payloadString,
      });
      
      const responseText = await response.text();
      
      return {
        success: response.ok,
        statusCode: response.status,
        responseBody: responseText,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
