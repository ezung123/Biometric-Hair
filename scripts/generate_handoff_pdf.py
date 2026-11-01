import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        
        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, letter[1] - 36, "BIOMETRIC HAIR 3D  |  TECHNICAL ARCHITECTURE AUDIT & HANDOFF")
            self.setStrokeColor(colors.HexColor("#C5A059"))
            self.setLineWidth(0.75)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)
            
        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_str)
        self.drawString(54, 32, "CONFIDENTIAL & PROPRIETARY  ·  BIOMETRIC HAIR PROJECT HANDOFF")
        self.setStrokeColor(colors.HexColor("#E4E4E7"))
        self.setLineWidth(0.5)
        self.line(54, 44, letter[0] - 54, 44)
        
        self.restoreState()

def build_pdf(filename="Biometric_Hair_3D_Project_Handoff.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0C0A09")     # Obsidian Dark
    SECONDARY = colors.HexColor("#1C1917")   # Deep Charcoal
    GOLD = colors.HexColor("#C5A059")        # Neoclassical Gold
    GOLD_LIGHT = colors.HexColor("#F9F6F0")  # Gold Tint
    TEXT_DARK = colors.HexColor("#18181B")   # Off-black body
    TEXT_MUTED = colors.HexColor("#52525B")  # Gray subtext
    BORDER_CLR = colors.HexColor("#E4E4E7")  # Border gray
    RED_ACCENT = colors.HexColor("#DC2626")  # Struggle badge
    GREEN_ACC = colors.HexColor("#16A34A")   # Complete badge

    # Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=GOLD,
        spaceAfter=14,
    )

    meta_style = ParagraphStyle(
        "CoverMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=TEXT_MUTED,
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_DARK,
        leftIndent=12,
        spaceAfter=3,
    )

    callout_style = ParagraphStyle(
        "CalloutText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12.5,
        textColor=PRIMARY,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_body_style = ParagraphStyle(
        "TableBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10.5,
        textColor=TEXT_DARK,
    )

    table_body_code = ParagraphStyle(
        "TableBodyCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=9.5,
        textColor=SECONDARY,
    )

    story = []

    # ─────────────────────────────────────────────────────────────────────────────
    # COVER / HEADER BANNER
    # ─────────────────────────────────────────────────────────────────────────────
    header_table_data = [
        [
            Paragraph("BIOMETRIC HAIR 3D", title_style),
            Paragraph("<b>VERSION:</b> 1.0.0 Production Handoff<br/><b>DATE:</b> November 2026<br/><b>STATUS:</b> TypeScript 0 Errors", meta_style),
        ],
        [
            Paragraph("Comprehensive Technical Architecture, System Stack, Intent, and Active Challenges", subtitle_style),
            Paragraph("<b>REPO:</b> ezung123/Biometric-Hair<br/><b>TARGET:</b> WebGL + Android / iOS", meta_style),
        ],
    ]
    header_table = Table(header_table_data, colWidths=[330, 174])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceBefore=4, spaceAfter=12))

    # ─────────────────────────────────────────────────────────────────────────────
    # 1. WHAT THIS PROJECT & FILE IS (EXECUTIVE SUMMARY)
    # ─────────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("1. Executive Summary & Project Purpose", h1_style))
    story.append(Paragraph(
        "<b>Biometric Hair 3D</b> is an enterprise-grade, camera-first mobile and web application engineered to "
        "eliminate salon haircut anxiety. Unlike legacy 'hair makeover' tools that paste flat stickers over photos "
        "or generative AI platforms that hallucinate completely foreign faces, Biometric Hair 3D implements a "
        "<b>strict zero-identity-swapping mandate</b>. The user's genuine face, bone structure, skin texture, and expressions "
        "remain 100% untouched; only the hairstyle is computationally tailored and volumetrically seated onto their skull.",
        body_style
    ))
    story.append(Paragraph(
        "<b>This Document:</b> Serves as the complete technical handoff and engineering architecture audit. It provides a "
        "deep-dive analysis of the technologies employed across the pipeline, the exact mathematical principles driving "
        "hairstyle recommendations, the architectural goals we are working to achieve, and an transparent account of the "
        "active challenges and physical edge cases currently being solved.",
        body_style
    ))

    # Highlights Box
    callout_data = [[
        Paragraph(
            "<b>Core Mandate:</b> Zero Face Replacement. Every hairstyle is fitted directly to the user's authentic facial geometry "
            "using 468 Dense 3D cranial landmarks, the Neoclassical Tripartite Law, and 4 concentric volumetric Three.js shells.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD_LIGHT),
        ("BOX", (0, 0), (-1, -1), 1, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────────────────────
    # 2. WHAT IS BEING USED (THE COMPLETE SYSTEM STACK)
    # ─────────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("2. Complete Technology Stack & Architectural Layers", h1_style))
    story.append(Paragraph(
        "The system operates across three synchronized processing tiers: the client application layer, "
        "the computer vision & 3D AR WebGL engine, and the remote AI reasoning & inpainting services.",
        body_style
    ))

    stack_data = [
        [
            Paragraph("Architecture Layer", table_header_style),
            Paragraph("Technologies / Libraries", table_header_style),
            Paragraph("Technical Role & Execution Purpose", table_header_style),
        ],
        [
            Paragraph("<b>Mobile / Web Client</b>", table_body_style),
            Paragraph("React Native 0.88<br/>React 19 / Expo SDK 58<br/>Expo Router v58<br/>React Native Web", table_body_code),
            Paragraph("Unified cross-platform camera-first interface (Snapchat-style), gesture navigation, luxury dark obsidian (`#0C0A09`) & gold HUD, segmented lens carousel.", table_body_style),
        ],
        [
            Paragraph("<b>Computer Vision & Tracking</b>", table_body_style),
            Paragraph("Google MediaPipe Vision WASM<br/>468 Face Landmarks<br/>Custom Deadband Filter<br/>Temporal Crest Anchor", table_body_code),
            Paragraph("Extracts 6-DOF head pose (Pitch, Yaw, Roll, Sway X, Depth Z) at 30 FPS. Tracks natural Trichion hairline and frontotemporal skull crests without re-render cascades.", table_body_style),
        ],
        [
            Paragraph("<b>3D Volumetric Engine</b>", table_body_style),
            Paragraph("Three.js WebGL (r187)<br/>4-Layer Concentric Shells<br/>Sobel 3D Normal Mapping<br/>3-Point Specular Studio Lighting", table_body_code),
            Paragraph("Constructs true volumetric depth (+0mm, +8mm, +16mm, +25mm) with micro-strand relief, dynamic inertia sway physics, and per-hairstyle skull seating.", table_body_style),
        ],
        [
            Paragraph("<b>AI Reasoning & Inpainting</b>", table_body_style),
            Paragraph("Meta Muse Spark Open (Baseten)<br/>Meta SAM (Modal Serverless)<br/>Photorealistic Synthesis Canvas", table_body_code),
            Paragraph("Muse analyzes Neoclassical facial thirds and generates styling prescriptions. Modal SAM and local canvas inpainter suppress old silhouette and cast ambient forehead shadows.", table_body_style),
        ],
        [
            Paragraph("<b>Native Hardening</b>", table_body_style),
            Paragraph("Expo Prebuild Engine<br/>Android Camera/Media Perms<br/>Google Play Manifest", table_body_code),
            Paragraph("Production Android package `com.ezung.biometrichair`, versionCode 1, scoped media permissions (`READ_MEDIA_IMAGES`), and cold-boot theme persistence.", table_body_style),
        ],
    ]
    stack_table = Table(stack_data, colWidths=[110, 140, 254])
    stack_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(stack_table)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────────────────────
    # 3. MATHEMATICAL & CEPHALOMETRIC FOUNDATIONS
    # ─────────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("3. Cephalometric Mathematics & The Golden Ratio Engine", h1_style))
    story.append(Paragraph(
        "Rather than relying on arbitrary fashion tags, Biometric Hair 3D matches haircuts based on proven "
        "craniofacial anthropometry and the <b>Golden Ratio phi (1.618)</b>:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>Neoclassical Tripartite Facial Thirds:</b> The face is segmented into Upper Third (Trichion hairline → Nasion brow), "
        "Mid Third (Nasion → Subnasale nose base), and Lower Third (Subnasale → Gnathion chin tip). A canonical balanced face "
        "possesses 33.3% / 33.3% / 33.3% distribution. The AI calculates third variance to prescribe specific crown volume or forehead fringe coverage.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Facial Index (Morphological Height-to-Width Ratio):</b> Measures anatomical face height divided by Bizygomatic cheekbone width × 100. "
        "Categorizes morphology strictly into <i>Oblong (>90)</i>, <i>Oval (85–90)</i>, <i>Round (<80)</i>, or <i>Square (angular jawline)</i>.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Cephalometric Calibration Matrix:</b> Each hairstyle maintains precise mathematical seating constraints "
        "defined in <code>STYLE_CALIBRATION</code>:",
        bullet_style
    ))
    story.append(Spacer(1, 4))

    calib_table_data = [
        [
            Paragraph("Hairstyle ID", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Gender", table_header_style),
            Paragraph("Hairline (yOffset)", table_header_style),
            Paragraph("Scale Factor", table_header_style),
            Paragraph("Cranial Wrap (Z)", table_header_style),
            Paragraph("Flank Drape", table_header_style),
        ],
        [Paragraph("curtain-fringe", table_body_code), Paragraph("Fringe", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.22", table_body_style), Paragraph("1.06", table_body_style), Paragraph("74 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("textured-crop", table_body_code), Paragraph("Crop", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.16", table_body_style), Paragraph("1.02", table_body_style), Paragraph("68 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("classic-quiff", table_body_code), Paragraph("Quiff", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.18", table_body_style), Paragraph("1.04", table_body_style), Paragraph("72 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("taper-fade", table_body_code), Paragraph("Fade", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.12", table_body_style), Paragraph("1.02", table_body_style), Paragraph("68 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("buzz-cut", table_body_code), Paragraph("Fade", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.10", table_body_style), Paragraph("0.98", table_body_style), Paragraph("62 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("afro-taper", table_body_code), Paragraph("Fade", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.22", table_body_style), Paragraph("1.10", table_body_style), Paragraph("80 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("curly-fringe", table_body_code), Paragraph("Curls", table_body_style), Paragraph("Men", table_body_style), Paragraph("0.18", table_body_style), Paragraph("1.06", table_body_style), Paragraph("74 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("layered-waves", table_body_code), Paragraph("Waves", table_body_style), Paragraph("Women", table_body_style), Paragraph("0.24", table_body_style), Paragraph("1.08", table_body_style), Paragraph("78 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("french-bob", table_body_code), Paragraph("Bob", table_body_style), Paragraph("Women", table_body_style), Paragraph("0.14", table_body_style), Paragraph("1.04", table_body_style), Paragraph("70 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("sleek-pixie", table_body_code), Paragraph("Pixie", table_body_style), Paragraph("Women", table_body_style), Paragraph("0.16", table_body_style), Paragraph("1.02", table_body_style), Paragraph("68 mm", table_body_style), Paragraph("No", table_body_style)],
        [Paragraph("box-braids", table_body_code), Paragraph("Braids", table_body_style), Paragraph("Women", table_body_style), Paragraph("0.14", table_body_style), Paragraph("1.08", table_body_style), Paragraph("84 mm", table_body_style), Paragraph("Yes", table_body_style)],
    ]
    calib_table = Table(calib_table_data, colWidths=[80, 50, 48, 86, 75, 95, 70])
    calib_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SECONDARY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8FA")]),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(calib_table)
    story.append(Spacer(1, 14))

    # Page Break for Goal & Struggles Analysis
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────────
    # 4. WHAT ARE WE TRYING TO ACHIEVE (STRATEGIC GOALS)
    # ─────────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("4. Project Objectives & What We Are Trying To Achieve", h1_style))
    story.append(Paragraph(
        "The overarching goal is to deploy the world's most physically accurate and visually compelling "
        "hair makeover application on both the Google Play Store and Apple App Store, offering a zero-friction user experience:",
        body_style
    ))

    goals_data = [
        [
            Paragraph("Objective", table_header_style),
            Paragraph("Target Milestone Metric", table_header_style),
            Paragraph("Engineering Delivery Strategy", table_header_style),
        ],
        [
            Paragraph("<b>Snapchat/Lensa AR Parity</b>", table_body_style),
            Paragraph("60 FPS render loop<br/>&lt;16ms frame budget", table_body_code),
            Paragraph("Direct GPU WebGL rendering, deadband landmark filtering, and eliminating React state cascades during steady pose tracking.", table_body_style),
        ],
        [
            Paragraph("<b>Snug Cephalometric Fit</b>", table_body_style),
            Paragraph("&lt;2mm hairline variance<br/>Zero helmet bloating", table_body_code),
            Paragraph("Recalibrated projection scales from 1.45 down to 0.35–0.45, utilizing temporal crest width and Trichion hairline bounds.", table_body_style),
        ],
        [
            Paragraph("<b>Ethnic & Texture Inclusivity</b>", table_body_style),
            Paragraph("100% hair type coverage<br/>Type 1A straight to 4C coils", table_body_code),
            Paragraph("Dedicated volumetric calibration profiles for Afro Taper (dense 4C coils), Curly Fringe (3A-3C spirals), and Box Braids (long draping plaits).", table_body_style),
        ],
        [
            Paragraph("<b>Luxury Non-AI Aesthetic</b>", table_body_style),
            Paragraph("Zero emoji clutter<br/>Cream/Obsidian UI", table_body_code),
            Paragraph("Sleek iOS-inspired typography, real-time gold holographic telemetry scanner, and buttery smooth drawer interactions.", table_body_style),
        ],
        [
            Paragraph("<b>App Store Deployment</b>", table_body_style),
            Paragraph("Google Play & App Store compliant", table_body_code),
            Paragraph("Production Android package `com.ezung.biometrichair`, versionCode 1, scoped media permissions, and zero TS errors.", table_body_style),
        ],
    ]
    goals_table = Table(goals_data, colWidths=[120, 114, 270])
    goals_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_CLR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(goals_table)
    story.append(Spacer(1, 14))

    # ─────────────────────────────────────────────────────────────────────────────
    # 5. WHAT WE ARE STRUGGLING WITH RIGHT NOW (ACTIVE CHALLENGES)
    # ─────────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("5. Critical Engineering Challenges & What We Are Struggling With", h1_style))
    story.append(Paragraph(
        "While the 3D pipeline and hairstyle seating have made massive leaps, building a real-time biometric "
        "AR engine across web and mobile introduces five fundamental physics and rendering bottlenecks:",
        body_style
    ))

    struggles = [
        (
            "1. WebGL Transparency Sorting & Strand Alpha Bleed Across 4 Shells",
            "When rendering 4 concentric volumetric shells (+0mm, +8mm, +16mm, +25mm) with semi-transparent alpha textures, "
            "standard WebGL depth-buffer writes (depthWrite: true) cause background shells to be clipped by the bounding boxes "
            "of foreground shells. Conversely, disabling depthWrite (depthWrite: false) causes alpha sorting anomalies when the "
            "user turns their head rapidly—strands on the far side of the head occasionally render in front of foreground locks. "
            "<b>Current Remediation:</b> Fine-tuning alphaTest (0.04–0.06 threshold) and dual-pass render queues to enforce strict front-to-back sorting."
        ),
        (
            "2. Consumer Webcam Lighting vs Studio Normal Map Shaders",
            "The Three.js scene employs studio three-point directional lighting (Key, Gold Rim, Cool Fill) and real-time Sobel normal maps "
            "to produce rich strand specular sheen. However, end-user webcams and smartphone front cameras often operate under harsh "
            "monochromatic fluorescent ceiling lights or dim bedroom settings. This creates a lighting mismatch where the augmented hair "
            "appears brightly studio-lit against a dark or grainy user photo. "
            "<b>Current Remediation:</b> Sampling cheek/forehead skin luminance in real-time to modulate Three.js ambient light intensity dynamically."
        ),
        (
            "3. Monocular 2D Cranial Depth Extrapolation on Pitch / Yaw",
            "Standard RGB cameras provide only 2D pixel coordinates. MediaPipe infers pseudo-3D landmarks, but deep pitch (tilting chin "
            "up or down) and yaw (turning left or right beyond 35 degrees) causes perspective distortion. Because human hair extends "
            "far behind the visible forehead line, yaw rotations can cause the posterior edge of the hair mesh to disconnect from "
            "the skull contour. "
            "<b>Current Remediation:</b> Anchoring the rotation origin at the frontotemporal crests rather than the nose tip, and clamping rotation gains."
        ),
        (
            "4. WebGL Context Contention Between MediaPipe and Three.js",
            "Both Google MediaPipe Face Landmarker (WASM/WebGL pipeline) and the Three.js 3D hair canvas require active WebGL contexts. "
            "On low-end Android devices or laptops with integrated GPUs, running two concurrent WebGL contexts alongside 1024x1024 video "
            "textures can cause GPU memory pressure, thermal throttling, or occasional context loss events. "
            "<b>Current Remediation:</b> Throttle MediaPipe inference from 60 Hz to 24–30 Hz with deadband filtering while keeping Three.js rendering at 60 FPS."
        ),
        (
            "5. Native Android Camera Stream Bridging (Expo vs Vision Camera)",
            "On web browsers, <code>navigator.mediaDevices.getUserMedia</code> directly binds a zero-copy HTML5 <code>&lt;video&gt;</code> element "
            "to both MediaPipe and Three.js. On native Android and iOS, raw camera frame buffers cannot be shared directly with web-based WebGL "
            "without custom frame processors or GLView native surface textures. Passing high-resolution camera frames across the React Native "
            "JavaScript bridge incurs significant serialization latency. "
            "<b>Current Remediation:</b> Implementing platform-specific branching with native frame-processor bindings for Android production."
        ),
    ]

    for title, desc in struggles:
        story.append(Paragraph(f"<b>{title}</b>", h2_style))
        story.append(Paragraph(desc, body_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 6))

    # ─────────────────────────────────────────────────────────────────────────────
    # 6. ROADMAP & NEXT IMMEDIATE ACTION ITEMS
    # ─────────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("6. Immediate Roadmap & Actionable Next Steps", h1_style))
    roadmap_items = [
        "<b>[Phase 1 Complete]</b> Eliminated white occluder cutout hole, calibrated snug Three.js projection (0.35–0.45), built 4 volumetric shells.",
        "<b>[Phase 2 Complete]</b> Replaced broken split-slider with luxury Biometric AI Scanning HUD; guaranteed hairstyle try-on rendering.",
        "<b>[Phase 3 Complete]</b> MediaPipe deadband jitter suppression, temporal crest anchoring, Android Play Store permissions in app.json.",
        "<b>[Phase 4 Complete]</b> Calibrated ethnic & curly profiles in STYLE_CALIBRATION (Afro Taper, Curly Fringe, Box Braids) with 1024x1024 PNGs.",
        "<b>[Upcoming Priority 1]</b> Deploy Ambient Luminance Normalization to match hair specular tone with user room lighting.",
        "<b>[Upcoming Priority 2]</b> Implement native Android VisionCamera / GLView frame processor bridge for standalone APK build.",
        "<b>[Upcoming Priority 3]</b> Submit release bundle to Google Play Internal Testing Track for closed community validation.",
    ]
    for item in roadmap_items:
        story.append(Paragraph(f"• {item}", bullet_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == "__main__":
    build_pdf()
