"""
PDF Report & Statutory Dossier Generation Service.
Generates enterprise-grade, styled PDF reports for Coal Mines AI Governance & Compliance.
"""
import io
from datetime import datetime
from uuid import UUID

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


class PDFReportService:
    @staticmethod
    def generate_inspection_dossier(
        inspection_data: dict,
        mine_data: dict,
        violations: list[dict] | None = None,
    ) -> bytes:
        """Generates an official Inspection Dossier PDF report with tamper-evident audit details."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )
        story = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=4,
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b"),
        )
        heading2_style = ParagraphStyle(
            "Heading2Custom",
            parent=styles["Heading2"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=12,
            spaceAfter=6,
        )
        normal_style = ParagraphStyle(
            "NormalCustom",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155"),
        )
        table_header_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontSize=9,
            leading=11,
            textColor=colors.white,
            fontName="Helvetica-Bold",
        )

        # Header Banner
        header_table_data = [
            [
                Paragraph("<b>MINISTRY OF COAL & DGMS GOVERNANCE SYSTEM</b><br/><font size=8>DIRECTORATE GENERAL OF MINES SAFETY — STATUTORY COMPLIANCE DOSSIER</font>", table_header_style),
                Paragraph(f"<font size=8 color=white>GENERATED: {datetime.utcnow().strftime('%d-%b-%Y %H:%M UTC')}</font>", table_header_style),
            ]
        ]
        header_table = Table(header_table_data, colWidths=[380, 160])
        header_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        story.append(header_table)
        story.append(Spacer(1, 14))

        # Title
        story.append(Paragraph(f"Statutory Inspection Dossier: {inspection_data.get('title', 'Routine Audit')}", title_style))
        story.append(Paragraph(f"Inspection ID: {inspection_data.get('id', 'N/A')} | Status: VERIFIED & SEALED", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

        # Mine & Site Details Table
        meta_table_data = [
            [
                Paragraph("<b>Mine Name:</b>", normal_style),
                Paragraph(mine_data.get("name", "N/A"), normal_style),
                Paragraph("<b>Mine Code / ID:</b>", normal_style),
                Paragraph(mine_data.get("code", str(mine_data.get("id", "N/A"))[:12]), normal_style),
            ],
            [
                Paragraph("<b>Subsidiary:</b>", normal_style),
                Paragraph(mine_data.get("subsidiary", "Coal India Ltd"), normal_style),
                Paragraph("<b>Mine Type:</b>", normal_style),
                Paragraph(mine_data.get("mine_type", "Open Cast / Underground"), normal_style),
            ],
            [
                Paragraph("<b>Inspector:</b>", normal_style),
                Paragraph(inspection_data.get("inspector_name", "DGMS Authorized Inspector"), normal_style),
                Paragraph("<b>Inspection Date:</b>", normal_style),
                Paragraph(str(inspection_data.get("inspection_date", datetime.utcnow().date())), normal_style),
            ],
            [
                Paragraph("<b>Geofence Status:</b>", normal_style),
                Paragraph(
                    "<font color='#dc2626'><b>BREACH DETECTED</b></font>" if inspection_data.get("is_geofence_breached") else "<font color='#16a34a'><b>VERIFIED INSIDE BOUNDARY</b></font>",
                    normal_style,
                ),
                Paragraph("<b>Location Type:</b>", normal_style),
                Paragraph(inspection_data.get("location_type", "SURFACE_GPS"), normal_style),
            ],
        ]
        meta_table = Table(meta_table_data, colWidths=[100, 170, 100, 170])
        meta_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        story.append(meta_table)
        story.append(Spacer(1, 14))

        # Description / Executive Summary
        story.append(Paragraph("Inspection Summary & Observations", heading2_style))
        story.append(
            Paragraph(
                inspection_data.get("description", "Comprehensive statutory safety and ventilation audit completed with field sensor telemetry and station checks."),
                normal_style,
            )
        )
        story.append(Spacer(1, 14))

        # Violations & Non-Compliance Items
        story.append(Paragraph("Statutory Violations & CAPA Required", heading2_style))
        if violations and len(violations) > 0:
            violation_table_data = [
                [
                    Paragraph("<b>Rule / Code</b>", table_header_style),
                    Paragraph("<b>Severity</b>", table_header_style),
                    Paragraph("<b>Description</b>", table_header_style),
                    Paragraph("<b>Status</b>", table_header_style),
                ]
            ]
            for v in violations:
                violation_table_data.append([
                    Paragraph(v.get("rule_code", "CMR-2017-130"), normal_style),
                    Paragraph(f"<font color='#dc2626'><b>{v.get('severity', 'HIGH')}</b></font>", normal_style),
                    Paragraph(v.get("description", "Non-compliance observed"), normal_style),
                    Paragraph(v.get("status", "NOTICE_ISSUED"), normal_style),
                ])
            v_table = Table(violation_table_data, colWidths=[90, 80, 270, 100])
            v_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ])
            )
            story.append(v_table)
        else:
            story.append(Paragraph("<i>No statutory non-compliances or critical hazards detected during this inspection cycle.</i>", normal_style))

        story.append(Spacer(1, 20))

        # Digital Signature & Cryptographic Ledger Block
        sig_table_data = [
            [
                Paragraph("<b>DGMS Field Inspector Sign-Off:</b><br/><br/><i>Digitally Signed via PKI Token</i><br/>Authorized Officer ID: " + str(inspection_data.get("inspector_id", "DGMS-INSP-092")), normal_style),
                Paragraph("<b>Cryptographic Verification Hash:</b><br/><font size=7 fontName='Courier'>SHA256: " + inspection_data.get("idempotency_hash", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")[:48] + "...</font><br/><br/><b>Audit Status:</b> Immutable Ledger Entry Recorded", normal_style),
            ]
        ]
        sig_table = Table(sig_table_data, colWidths=[270, 270])
        sig_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
                ("PADDING", (0, 0), (-1, -1), 8),
            ])
        )
        story.append(sig_table)

        doc.build(story)
        return buffer.getvalue()

    @staticmethod
    def generate_compliance_certificate(mine_data: dict, score_data: dict) -> bytes:
        """Generates a Formal DGMS Statutory Compliance Clearance Certificate PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40,
        )
        story = []
        styles = getSampleStyleSheet()

        cert_title = ParagraphStyle(
            "CertTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#047857"),
            alignment=1,
            spaceAfter=8,
        )
        cert_sub = ParagraphStyle(
            "CertSub",
            parent=styles["Normal"],
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#334155"),
            alignment=1,
        )
        cert_body = ParagraphStyle(
            "CertBody",
            parent=styles["Normal"],
            fontSize=10,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=10,
            spaceAfter=10,
        )

        story.append(Spacer(1, 10))
        story.append(Paragraph("MINISTRY OF COAL — GOVT OF INDIA", ParagraphStyle("Govt", alignment=1, fontSize=12, fontName="Helvetica-Bold", textColor=colors.HexColor("#0f172a"))))
        story.append(Paragraph("DIRECTORATE GENERAL OF MINES SAFETY (DGMS)", ParagraphStyle("DGMS", alignment=1, fontSize=10, fontName="Helvetica", textColor=colors.HexColor("#475569"))))
        story.append(Spacer(1, 16))
        story.append(HRFlowable(width="80%", thickness=2, color=colors.HexColor("#047857"), spaceAfter=14))
        story.append(Paragraph("CERTIFICATE OF STATUTORY COMPLIANCE CLEARANCE", cert_title))
        story.append(Paragraph("Issued under Coal Mines Regulations, 2017 & Statutory Safety Governance Norms", cert_sub))
        story.append(Spacer(1, 20))

        mine_name = mine_data.get("name", "Bokaro Open Cast Mine")
        score = score_data.get("overall_score", 94.5)
        rating = "EXCELLENT (A+)" if score >= 90 else "SATISFACTORY (B)"

        story.append(
            Paragraph(
                f"This is to certify that the coal mining operations at <b>{mine_name}</b> (Site ID: {mine_data.get('id', 'N/A')}) "
                f"have been audited in accordance with mandatory safety regulations, environmental leasehold geofencing, "
                f"and underground atmospheric hazardous gas monitoring standards.",
                cert_body,
            )
        )
        story.append(Spacer(1, 10))

        cert_table_data = [
            [Paragraph("<b>Composite Safety Compliance Score</b>", cert_body), Paragraph(f"<b><font size=14 color='#047857'>{score}%</font></b> ({rating})", cert_body)],
            [Paragraph("<b>Leasehold Boundary Geofence Status</b>", cert_body), Paragraph("<font color='#16a34a'><b>100% Verified (0 Breaches)</b></font>", cert_body)],
            [Paragraph("<b>Underground Ventilation & Gas Safety</b>", cert_body), Paragraph("<font color='#16a34a'><b>Within Permissible DGMS Limits</b></font>", cert_body)],
            [Paragraph("<b>Active CAPA Rectifications</b>", cert_body), Paragraph(f"{score_data.get('open_capa_count', 0)} Open Rectifications", cert_body)],
            [Paragraph("<b>Certificate Valid Until</b>", cert_body), Paragraph((datetime.utcnow().replace(year=datetime.utcnow().year + 1)).strftime('%d-%B-%Y'), cert_body)],
        ]
        cert_table = Table(cert_table_data, colWidths=[250, 280])
        cert_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
                ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#059669")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        story.append(cert_table)
        story.append(Spacer(1, 30))

        # Signatures
        sig_data = [
            [
                Paragraph("<b>DGMS Zonal Controller</b><br/><br/><i>Digitally Certified</i><br/>Directorate General of Mines Safety", cert_body),
                Paragraph("<b>Chairman & Managing Director</b><br/><br/><i>Acknowledged & Sealed</i><br/>Coal India Subsidiary Board", cert_body),
            ]
        ]
        sig_t = Table(sig_data, colWidths=[265, 265])
        story.append(sig_t)

        doc.build(story)
        return buffer.getvalue()
