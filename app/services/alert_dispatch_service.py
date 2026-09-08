"""
Statutory Alert Dispatch Service (SIH26024).
Coordinates multi-recipient emergency alert notifications and automated SMS text messages
to registered mobile numbers of Colliery Managers, DGMS Inspectors, and Ministry Officials.
"""
import logging
from typing import List, Dict, Any, Optional

from app.services.sms_service import SMSService, sms_service
from app.infrastructure.database.models import UserModel

logger = logging.getLogger("coal_governance.alert_dispatch_service")

# Statutory default mobile directory for critical fallback communication
ROLE_DEFAULT_PHONE_MAP = {
    "MINISTRY_AUDITOR": "+919876543210",
    "DGMS_INSPECTOR": "+919876543211",
    "COLLIERY_MANAGER": "+919876543212",
    "AREA_ADMIN": "+919876543213",
    "SHIFT_OVERMAN": "+919876543215",
    "FIELD_WORKER": "+919876543215",
    "MINING_SIRDAR": "+919876543215",
    "CONTRACTOR_ADMIN": "+919876543216",
}


class AlertDispatchService:
    def __init__(self, sms_svc: Optional[SMSService] = None) -> None:
        self.sms_service = sms_svc or sms_service

    async def resolve_recipient_phones(self, recipient_roles: List[str]) -> List[str]:
        """
        Resolves registered phone numbers from UserModel by role.
        Falls back to statutory default numbers if no user record or phone is found.
        """
        phones: List[str] = []
        for role in recipient_roles:
            norm_role = role.strip().upper()
            user_phone = None
            try:
                users = await UserModel.find(UserModel.role == norm_role).to_list()
                for u in users:
                    if u.phone_number and u.phone_number.strip():
                        user_phone = u.phone_number.strip()
                        break
            except Exception as e:
                logger.debug("Database user phone lookup skipped: %s", e)

            if not user_phone:
                user_phone = ROLE_DEFAULT_PHONE_MAP.get(norm_role, "+919876543212")

            if user_phone and user_phone not in phones:
                phones.append(user_phone)

        return phones

    async def trigger_tamper_alert(
        self,
        mine_name: str,
        sequence_number: int,
        incident_id: str = "",
    ) -> Dict[str, Any]:
        """
        1. Cryptographic Tamper Ledger Alert:
        Triggered when unauthorized record alteration or hash chain divergence occurs.
        Recipients: Ministry Auditor, DGMS Inspector, Colliery Manager.
        """
        target_roles = ["MINISTRY_AUDITOR", "DGMS_INSPECTOR", "COLLIERY_MANAGER"]
        phones = await self.resolve_recipient_phones(target_roles)
        body = (
            f"🚨 DGMS STATUTORY ALERT: Unauthorized record tampering attempt detected at {mine_name}. "
            f"Ledger block #{sequence_number} invalidated. Ref: SIH26024"
        )
        dispatch_res = await self.sms_service.dispatch_sms(phones, body)
        return {
            "event": "TAMPER_LEDGER_ALERT",
            "target_roles": target_roles,
            "recipients": phones,
            "sms_dispatch": dispatch_res,
        }

    async def trigger_worker_emergency_halt(
        self,
        mine_name: str,
        location_desc: str,
        worker_name: str = "",
    ) -> Dict[str, Any]:
        """
        2. Worker Emergency Stop Grievance:
        Triggered when worker submits issue with urgency="EMERGENCY_STOP" on /worker/report-issue.
        Recipients: Colliery Manager, Shift Overman.
        """
        target_roles = ["COLLIERY_MANAGER", "SHIFT_OVERMAN"]
        phones = await self.resolve_recipient_phones(target_roles)
        body = (
            f"⚠️ EMERGENCY PIT ALERT: Immediate safety threat reported at {mine_name}, "
            f"Gallery {location_desc}. Worker hazard halt triggered. Check portal immediately."
        )
        dispatch_res = await self.sms_service.dispatch_sms(phones, body)
        return {
            "event": "WORKER_EMERGENCY_HALT",
            "target_roles": target_roles,
            "recipients": phones,
            "sms_dispatch": dispatch_res,
        }

    async def trigger_predictive_gas_warning(
        self,
        mine_name: str,
        hours: int = 36,
        metric_name: str = "CO rate > 3ppm/hr",
    ) -> Dict[str, Any]:
        """
        3. Predictive 72-Hour Spontaneous Combustion / Gas Warning:
        Triggered when AI risk engine predicts CH4 >= 0.75% or dCO/dt >= 3 ppm/hr.
        Recipients: Colliery Manager, DGMS Inspector.
        """
        target_roles = ["COLLIERY_MANAGER", "DGMS_INSPECTOR"]
        phones = await self.resolve_recipient_phones(target_roles)
        body = (
            f"🔴 CMR 2017 EARLY WARNING: AI forecast predicts spontaneous heating ({metric_name}) "
            f"at {mine_name} in {hours}h. Proactive ventilation adjustment required."
        )
        dispatch_res = await self.sms_service.dispatch_sms(phones, body)
        return {
            "event": "PREDICTIVE_GAS_WARNING",
            "target_roles": target_roles,
            "recipients": phones,
            "sms_dispatch": dispatch_res,
        }


# Singleton instance
alert_dispatch_service = AlertDispatchService()
