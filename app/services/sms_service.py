"""
SMS Emergency Alert Dispatch Service (SIH26024).
Provides high-priority statutory SMS notifications to Colliery Managers,
DGMS Inspectors, and Ministry Officials for critical mining hazard events.
"""
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("coal_governance.sms_service")


class SMSService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        sender_id: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or os.getenv("SMS_PROVIDER_API_KEY", "")
        self.enabled = bool(self.api_key)
        self.sender_id = sender_id or os.getenv("SMS_SENDER_ID", "COALGOV")

    async def dispatch_sms(self, phone_numbers: List[str], message_body: str) -> Dict[str, Any]:
        """
        Dispatches SMS text messages to specified mobile numbers.
        If no production SMS provider API key is configured, operates in high-visibility
        structured mock mode suitable for DGMS auditing, development, and demonstration.
        """
        clean_numbers = [p.strip() for p in phone_numbers if p and len(p.strip()) >= 10]
        if not clean_numbers:
            logger.info("No valid phone numbers provided for SMS dispatch.")
            return {
                "status": "SKIPPED_NO_RECIPIENTS",
                "recipients": [],
                "message_body": message_body,
            }

        if not self.enabled:
            # High-visibility structured log for DGMS compliance & dev demonstration
            logger.warning(
                "\n"
                "================================================================================\n"
                "                  [MOCK SMS STATUTORY EMERGENCY DISPATCH]                      \n"
                "================================================================================\n"
                f"SENDER ID   : {self.sender_id}\n"
                f"RECIPIENTS  : {clean_numbers}\n"
                f"MESSAGE     :\n{message_body}\n"
                "================================================================================"
            )
            return {
                "status": "MOCKED_SUCCESS",
                "recipients": clean_numbers,
                "message_body": message_body,
                "sender_id": self.sender_id,
            }

        # Real SMS Gateway integration (e.g. Fast2SMS / Twilio / SMPP Gateway)
        try:
            import httpx
            # Example Fast2SMS / Indian SMS DLT API dispatch:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://www.fast2sms.com/dev/bulkV2",
                    headers={"authorization": self.api_key},
                    json={
                        "route": "v3",
                        "sender_id": self.sender_id,
                        "message": message_body,
                        "language": "english",
                        "flash": 0,
                        "numbers": ",".join(clean_numbers),
                    },
                )
                logger.info("Live SMS gateway response status: %s", response.status_code)
                return {
                    "status": "DELIVERED" if response.is_success else "GATEWAY_ERROR",
                    "status_code": response.status_code,
                    "recipients": clean_numbers,
                    "message_body": message_body,
                }
        except Exception as e:
            logger.error("Failed to send live SMS via gateway: %s", e)
            return {
                "status": "DISPATCH_FAILED",
                "error": str(e),
                "recipients": clean_numbers,
                "message_body": message_body,
            }


# Singleton instance
sms_service = SMSService()
