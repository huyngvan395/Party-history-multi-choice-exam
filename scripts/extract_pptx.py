#!/usr/bin/env python3
"""
Extract text from PowerPoint (.pptx) files in docs/ using only Python stdlib
(zipfile + xml.etree.ElementTree), with automatic TCVN3 & VNI -> Unicode decoding.

Outputs:
  - docs/extracted_c1.md
  - docs/extracted_c2.md
  - docs/extracted_c3.md
"""

from __future__ import annotations

import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "dgm": "http://schemas.openxmlformats.org/drawingml/2006/diagram",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

# =============================================================================
# 1. TCVN3 (ABC) -> Unicode Mapping
# =============================================================================
TCVN3_MAP: Dict[str, str] = {
    "\u00a1": "Ă",  # ¡
    "\u00a2": "Â",  # ¢
    "\u00a3": "Ê",  # £
    "\u00a4": "Ô",  # ¤
    "\u00a5": "Ơ",  # ¥
    "\u00a6": "Ư",  # ¦
    "\u00a7": "Đ",  # §
    "\u00a8": "ă",  # ¨
    "\u00a9": "â",  # ©
    "\u00aa": "ê",  # ª
    "\u00ab": "ô",  # «
    "\u00ac": "ơ",  # ¬
    "\u00ad": "ư",  # soft hyphen (TCVN3 ư)
    "\u00ae": "đ",  # ®
    "\u00b5": "à",  # µ
    "\u00b6": "ả",  # ¶
    "\u00b7": "ã",  # ·
    "\u00b8": "á",  # ¸
    "\u00b9": "ạ",  # ¹
    "\u00bb": "ằ",  # »
    "\u00bc": "ẳ",  # ¼
    "\u00bd": "ẵ",  # ½
    "\u00be": "ắ",  # ¾
    "\u00c6": "ặ",  # Æ
    "\u00c7": "ầ",  # Ç
    "\u00c8": "ẩ",  # È
    "\u00c9": "ẫ",  # É
    "\u00ca": "ấ",  # Ê
    "\u00cb": "ậ",  # Ë
    "\u00cc": "è",  # Ì
    "\u00ce": "ẻ",  # Î
    "\u00cf": "ẽ",  # Ï
    "\u00d0": "é",  # Ð
    "\u00d1": "ẹ",  # Ñ
    "\u00d2": "ề",  # Ò
    "\u00d3": "ể",  # Ó
    "\u00d4": "ễ",  # Ô
    "\u00d5": "ế",  # Õ
    "\u00d6": "ệ",  # Ö
    "\u00d7": "ì",  # ×
    "\u00d8": "ỉ",  # Ø
    "\u00dc": "ĩ",  # Ü
    "\u00dd": "í",  # Ý
    "\u00de": "ị",  # Þ
    "\u00df": "ò",  # ß
    "\u00e1": "ỏ",  # á
    "\u00e2": "õ",  # â
    "\u00e3": "ó",  # ã
    "\u00e4": "ọ",  # ä
    "\u00e5": "ồ",  # å
    "\u00e6": "ổ",  # æ
    "\u00e7": "ỗ",  # ç
    "\u00e8": "ố",  # è
    "\u00e9": "ộ",  # é
    "\u00ea": "ờ",  # ê
    "\u00eb": "ở",  # ë
    "\u00ec": "ỡ",  # ì
    "\u00ed": "ớ",  # í
    "\u00ee": "ợ",  # î
    "\u00ef": "ù",  # ï
    "\u00f1": "ủ",  # ñ
    "\u00f2": "ũ",  # ò
    "\u00f3": "ú",  # ó
    "\u00f4": "ụ",  # ô
    "\u00f5": "ừ",  # õ
    "\u00f6": "ử",  # ö
    "\u00f7": "ữ",  # ÷
    "\u00f8": "ứ",  # ø
    "\u00f9": "ự",  # ù
    "\u00fa": "ỳ",  # ú
    "\u00fb": "ỷ",  # û
    "\u00fc": "ỹ",  # ü
    "\u00fd": "ý",  # ý
    "\u00fe": "ỵ",  # þ
}

# Characters that appear in TCVN3 but NEVER appear in normal Vietnamese Unicode prose
TCVN3_SIGNATURE = set(TCVN3_MAP.keys()) - set(
    "àáâãèéêìíòóôõùúýÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝ×÷§©®«»°"
)
# Also include uppercase Latin-1 chars that are common in TCVN3 but rare in Vietnamese Unicode
TCVN3_EXTRA_SIG = set("§®µ¶·¸¹»¼½¾ÆÇËÎÏÐÑÖØÜÞßäåæçëîïñöøûüþª«¬\u00ad¨")

# Extended Unicode Vietnamese characters (codepoints > 0x00FF)
VI_UNICODE_EXT_RE = re.compile(
    r"[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]"
)

# =============================================================================
# 2. VNI-Windows -> Unicode Mapping
# =============================================================================
VNI_2CHAR: List[Tuple[str, str]] = [
    # a
    ("aù", "á"), ("aø", "à"), ("aû", "ả"), ("aõ", "ã"), ("aï", "ạ"),
    ("aê", "ă"), ("aé", "ắ"), ("aè", "ằ"), ("aú", "ẳ"), ("aü", "ẵ"), ("aë", "ặ"),
    ("aâ", "â"), ("aá", "ấ"), ("aà", "ầ"), ("aå", "ẩ"), ("aã", "ẫ"), ("aä", "ậ"),
    ("AÙ", "Á"), ("AØ", "À"), ("AÛ", "Ả"), ("AÕ", "Ã"), ("AÏ", "Ạ"),
    ("AÊ", "Ă"), ("AÉ", "Ắ"), ("AÈ", "Ằ"), ("AÚ", "Ẳ"), ("AÜ", "Ẵ"), ("AË", "Ặ"),
    ("AÂ", "Â"), ("AÁ", "Ấ"), ("AÀ", "Ầ"), ("AÅ", "Ẩ"), ("AÃ", "Ẫ"), ("AÄ", "Ậ"),
    # e
    ("eù", "é"), ("eø", "è"), ("eû", "ẻ"), ("eõ", "ẽ"), ("eï", "ẹ"),
    ("eâ", "ê"), ("eá", "ế"), ("eà", "ề"), ("eå", "ể"), ("eã", "ễ"), ("eä", "ệ"),
    ("EÙ", "É"), ("EØ", "È"), ("EÛ", "Ẻ"), ("EÕ", "Ẽ"), ("EÏ", "Ẹ"),
    ("EÂ", "Ê"), ("EÁ", "Ế"), ("EÀ", "Ề"), ("EÅ", "Ể"), ("EÃ", "Ễ"), ("EÄ", "Ệ"),
    # o
    ("où", "ó"), ("oø", "ò"), ("oû", "ỏ"), ("oõ", "õ"), ("oï", "ọ"),
    ("oâ", "ô"), ("oá", "ố"), ("oà", "ồ"), ("oå", "ổ"), ("oã", "ỗ"), ("oä", "ộ"),
    ("ôù", "ớ"), ("ôø", "ờ"), ("ôû", "ở"), ("ôõ", "ỡ"), ("ôï", "ợ"),
    ("OÙ", "Ó"), ("OØ", "Ò"), ("OÛ", "Ỏ"), ("OÕ", "Õ"), ("OÏ", "Ọ"),
    ("OÂ", "Ô"), ("OÁ", "Ố"), ("OÀ", "Ồ"), ("OÅ", "Ổ"), ("OÃ", "Ỗ"), ("OÄ", "Ộ"),
    ("ÔÙ", "Ớ"), ("ÔØ", "Ờ"), ("ÔÛ", "Ở"), ("ÔÕ", "Ỡ"), ("ÔÏ", "Ợ"),
    # u
    ("uù", "ú"), ("uø", "ù"), ("uû", "ủ"), ("uõ", "ũ"), ("uï", "ụ"),
    ("öù", "ứ"), ("öø", "ừ"), ("öû", "ử"), ("öõ", "ữ"), ("öï", "ự"),
    ("UÙ", "Ú"), ("UØ", "Ù"), ("UÛ", "Ủ"), ("UÕ", "Ũ"), ("UÏ", "Ụ"),
    ("ÖÙ", "Ứ"), ("ÖØ", "Ừ"), ("ÖÛ", "Ử"), ("ÖÕ", "Ữ"), ("ÖÏ", "Ự"),
    # y
    ("yù", "ý"), ("yø", "ỳ"), ("yû", "ỷ"), ("yõ", "ỹ"), ("yï", "ỵ"),
    ("YÙ", "Ý"), ("YØ", "Ỳ"), ("YÛ", "Ỷ"), ("YÕ", "Ỹ"), ("YÏ", "Ỵ"),
]

VNI_1CHAR: Dict[str, str] = {
    "í": "í", "ì": "ì", "æ": "ỉ", "ó": "ĩ", "ò": "ị",
    "Í": "Í", "Ì": "Ì", "Æ": "Ỉ", "Ó": "Ĩ", "Ò": "Ị",
    "ñ": "đ", "Ñ": "Đ",
    "ô": "ơ", "Ô": "Ơ",
    "ö": "ư", "Ö": "Ư",
    "î": "ị", "Î": "Ị",
}

VNI_PATTERN = re.compile(
    r"(?:[aAeEoOuUyY][ùøûõïÙØÛÕÏ]|[aA][êéèúüëâáàåãäÊÉÈÚÜËÂÁÀÅÃÄ]|[eEoO][âáàåãäÂÁÀÅÃÄ]|[öÖ][ùøûõïÙØÛÕÏ]|[ôÔ][ùøûõïÙØÛÕÏ]|ñ|Ñ|ö|Ö)"
)


def is_already_unicode_vi(text: str) -> bool:
    """Return True if text contains Vietnamese Unicode chars outside Latin-1."""
    return bool(VI_UNICODE_EXT_RE.search(text))


def is_tcvn3_font(font_name: str) -> bool:
    return font_name.startswith(".Vn") or font_name.startswith(".vn")


def is_tcvn3_allcaps_font(font_name: str) -> bool:
    """TCVN3 fonts ending in 'H' (e.g., .VnTimeH, .VnArialH) render uppercase."""
    fn = font_name.strip()
    return is_tcvn3_font(fn) and fn.endswith("H")


def is_vni_font(font_name: str) -> bool:
    return font_name.upper().startswith("VNI")


def looks_like_tcvn3(text: str) -> bool:
    if is_already_unicode_vi(text):
        return False
    # Check strong TCVN3 signature characters
    for ch in text:
        if ch in TCVN3_EXTRA_SIG or ch in TCVN3_SIGNATURE:
            return True
    # Also detect classic TCVN3 patterns using Latin-1 overlap (e.g. "c«ng", "hép", "§¶ng", "cuéc", "tiªu", "Kú")
    if re.search(r"[bcdfghklmnpqrstvwxzBCDFGHKLMNPQRSTVWXZ][éèêíìóòôõúùý][bcdfghklmnpqrstvwxz]", text):
        # Be careful not to trigger on normal Vietnamese like "kém", "tên", "tính"
        pass
    return False


def looks_like_vni(text: str) -> bool:
    if is_already_unicode_vi(text):
        return False
    if looks_like_tcvn3(text):
        return False
    return bool(VNI_PATTERN.search(text))


def convert_tcvn3(text: str, all_caps: bool = False) -> str:
    """Convert a TCVN3 string to Unicode, preserving capitalization smartly."""
    # Process word-by-word so ALL-CAPS words like "HOA Kú" -> "HOA KỲ"
    tokens = re.split(r"(\s+)", text)
    out_tokens: List[str] = []
    for tok in tokens:
        if not tok or tok.isspace():
            out_tokens.append(tok)
            continue
        # Detect if the ASCII letters in this word are all uppercase (and at least 1 uppercase letter)
        ascii_letters = [c for c in tok if ("A" <= c <= "Z") or ("a" <= c <= "z")]
        word_is_upper = bool(ascii_letters) and all("A" <= c <= "Z" for c in ascii_letters)
        converted = "".join(TCVN3_MAP.get(ch, ch) for ch in tok)
        if all_caps:
            converted = converted.upper()
        elif word_is_upper and len(tok) >= 2:
            # Only uppercase converted chars if the word looks like an ALL-CAPS word (e.g., Kú in HOA Kú)
            # Wait: "Hội" has ascii_letters=['H','i'] -> not all upper. "Kú" has ['K'] -> all upper!
            # Avoid turning "Của" (only 'C' is ASCII? No, 'a' is ASCII so not all upper)
            # Avoid turning "Số" ('S' is ASCII, 'è' is non-ASCII -> 1 ASCII upper + 1 TCVN3 vowel -> could be Title Case!)
            # So only uppercase if adjacent word in sentence is ALL CAPS or word has >= 2 ASCII uppercase letters
            if len(ascii_letters) >= 2:
                converted = converted.upper()
        out_tokens.append(converted)

    result = "".join(out_tokens)
    # Second pass: fix ALL-CAPS sequences like "HOA Kỳ" -> "HOA KỲ"
    words = result.split(" ")
    if len(words) >= 2:
        for i, w in enumerate(words):
            letters = [c for c in w if c.isalpha()]
            if not letters:
                continue
            prev_upper = i > 0 and any(c.isalpha() for c in words[i - 1]) and words[i - 1].isupper()
            next_upper = i + 1 < len(words) and any(c.isalpha() for c in words[i + 1]) and words[i + 1].isupper()
            if (prev_upper or next_upper) and letters[0].isupper():
                # Check if only the converted TCVN3 vowel was lowercase
                if sum(1 for c in letters if c.islower()) <= 2:
                    words[i] = w.upper()
        result = " ".join(words)
    return result


def convert_vni(text: str) -> str:
    """Convert a VNI-Windows string to Unicode."""
    res = text
    for src, dst in VNI_2CHAR:
        if src in res:
            res = res.replace(src, dst)
    # Replace remaining 1-char VNI symbols carefully
    out = []
    for ch in res:
        out.append(VNI_1CHAR.get(ch, ch))
    return "".join(out)


def decode_mixed_words(text: str) -> str:
    """Decode individual TCVN3/VNI tokens embedded inside an otherwise Unicode string."""
    tokens = re.split(r"(\s+)", text)
    out: List[str] = []
    for tok in tokens:
        if not tok or tok.isspace():
            out.append(tok)
            continue
        if not is_already_unicode_vi(tok) and looks_like_tcvn3(tok):
            out.append(convert_tcvn3(tok))
        elif not is_already_unicode_vi(tok) and looks_like_vni(tok):
            out.append(convert_vni(tok))
        else:
            out.append(tok)
    return "".join(out)


def decode_run_text(text: str, font_name: str, para_is_tcvn3: bool = False, para_is_vni: bool = False) -> str:
    """Decode a single run's text based on font metadata and heuristic detection."""
    if not text:
        return ""
    if is_already_unicode_vi(text):
        # Even in a Unicode run, an isolated word may carry TCVN3/VNI chars (e.g. "t¹i")
        if any(ch in TCVN3_EXTRA_SIG for ch in text):
            return decode_mixed_words(text)
        return text

    # Font-based detection (only if text has non-ASCII characters)
    has_non_ascii = any(ord(c) > 127 for c in text)
    if not has_non_ascii:
        return text

    if is_tcvn3_font(font_name) or para_is_tcvn3 or looks_like_tcvn3(text):
        return convert_tcvn3(text, all_caps=is_tcvn3_allcaps_font(font_name))
    if is_vni_font(font_name) or para_is_vni or looks_like_vni(text):
        return convert_vni(text)
    return text


# =============================================================================
# 3. PPTX XML Parsing (Slides, Tables, SmartArt Diagrams, Speaker Notes)
# =============================================================================
def parse_rels(z: zipfile.ZipFile, rels_path: str) -> Dict[str, Tuple[str, str]]:
    """Return dict: rId -> (Type, Target)."""
    if rels_path not in z.namelist():
        return {}
    root = ET.fromstring(z.read(rels_path))
    rels: Dict[str, Tuple[str, str]] = {}
    for rel in root.findall("rel:Relationship", NS):
        rid = rel.attrib.get("Id", "")
        rtype = rel.attrib.get("Type", "")
        target = rel.attrib.get("Target", "")
        rels[rid] = (rtype, target)
    return rels


def resolve_ppt_path(base_dir: str, target: str) -> str:
    """Resolve relative OpenXML path like '../notesSlides/notesSlide1.xml'."""
    if target.startswith("/"):
        return target.lstrip("/")
    joined = os.path.normpath(os.path.join(base_dir, target)).replace("\\", "/")
    return joined


def get_ordered_slides(z: zipfile.ZipFile) -> List[str]:
    """Get slides in presentation order from ppt/presentation.xml."""
    pres_rels = parse_rels(z, "ppt/_rels/presentation.xml.rels")
    slides: List[str] = []
    if "ppt/presentation.xml" in z.namelist():
        root = ET.fromstring(z.read("ppt/presentation.xml"))
        sld_id_lst = root.find("p:sldIdLst", NS)
        if sld_id_lst is not None:
            for sld_id in sld_id_lst.findall("p:sldId", NS):
                rid = sld_id.attrib.get(f"{{{NS['r']}}}id", "")
                if rid in pres_rels:
                    _, target = pres_rels[rid]
                    path = resolve_ppt_path("ppt", target)
                    if path in z.namelist():
                        slides.append(path)
    if slides:
        return slides

    # Fallback: sort numerically
    fallback = [
        n for n in z.namelist()
        if re.match(r"^ppt/slides/slide\d+\.xml$", n)
    ]
    fallback.sort(key=lambda s: int(re.search(r"slide(\d+)\.xml$", s).group(1)))
    return fallback


def extract_paragraph(p_el: ET.Element) -> Tuple[str, int]:
    """Extract decoded text and indentation level from an <a:p> element."""
    pPr = p_el.find("a:pPr", NS)
    lvl = 0
    if pPr is not None:
        lvl = int(pPr.attrib.get("lvl", "0") or "0")

    # Collect raw runs (including line breaks <a:br> and fields <a:fld>)
    raw_items: List[Tuple[str, str]] = []  # (font_name, text)
    for child in p_el:
        tag = child.tag.split("}")[-1]
        if tag in ("r", "fld"):
            t_el = child.find("a:t", NS)
            if t_el is None or t_el.text is None:
                continue
            rPr = child.find("a:rPr", NS)
            tf = ""
            if rPr is not None:
                lat = rPr.find("a:latin", NS)
                if lat is not None:
                    tf = lat.attrib.get("typeface", "")
            raw_items.append((tf, t_el.text))
        elif tag == "br":
            raw_items.append(("", "\n"))

    if not raw_items:
        return "", lvl

    # Paragraph-level heuristic to catch Latin-1 overlap runs in a TCVN3/VNI paragraph
    full_raw = "".join(txt for _, txt in raw_items)
    para_has_unicode = is_already_unicode_vi(full_raw)
    para_is_tcvn3 = (not para_has_unicode) and (
        looks_like_tcvn3(full_raw) or any(is_tcvn3_font(tf) for tf, _ in raw_items)
    )
    para_is_vni = (not para_has_unicode) and (not para_is_tcvn3) and (
        looks_like_vni(full_raw) or any(is_vni_font(tf) for tf, _ in raw_items)
    )

    # If the paragraph is uniformly TCVN3 or VNI, decode the joined text so split runs
    # inside a single word (like "HOA " + "Kú") convert cleanly together!
    if para_is_tcvn3 and not para_has_unicode:
        all_caps = any(is_tcvn3_allcaps_font(tf) for tf, _ in raw_items)
        decoded = convert_tcvn3(full_raw, all_caps=all_caps)
    elif para_is_vni and not para_has_unicode:
        decoded = convert_vni(full_raw)
    else:
        # Mixed paragraph: decode run by run
        decoded = "".join(
            decode_run_text(txt, tf, para_is_tcvn3=False, para_is_vni=False)
            for tf, txt in raw_items
        )

    # Clean soft spaces and control chars
    decoded = decoded.replace("\u000b", "\n").replace("\u200b", "")
    # Collapse excessive internal whitespace per line
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in decoded.split("\n")]
    cleaned = "\n".join(ln for ln in lines if ln)
    return cleaned, lvl


def extract_txbody(txbody: ET.Element) -> List[Tuple[str, int]]:
    out: List[Tuple[str, int]] = []
    for p in txbody.findall("a:p", NS):
        txt, lvl = extract_paragraph(p)
        if txt:
            out.append((txt, lvl))
    return out


def extract_table(tbl: ET.Element) -> List[str]:
    """Extract an <a:tbl> as Markdown table rows."""
    rows: List[List[str]] = []
    for tr in tbl.findall("a:tr", NS):
        row_cells: List[str] = []
        for tc in tr.findall("a:tc", NS):
            txbody = tc.find("a:txBody", NS)
            if txbody is not None:
                paras = [t.replace("\n", " ") for t, _ in extract_txbody(txbody)]
                cell_text = " / ".join(paras).replace("|", "\\|")
            else:
                cell_text = ""
            row_cells.append(cell_text)
        if any(c.strip() for c in row_cells):
            rows.append(row_cells)

    if not rows:
        return []

    max_cols = max(len(r) for r in rows)
    md_lines: List[str] = []
    for idx, r in enumerate(rows):
        padded = r + [""] * (max_cols - len(r))
        md_lines.append("| " + " | ".join(padded) + " |")
        if idx == 0:
            md_lines.append("| " + " | ".join(["---"] * max_cols) + " |")
    return md_lines


def extract_shape_tree(sp_tree: ET.Element, skip_sld_num: bool = False) -> List[str]:
    """Recursively extract text from shapes, grouped shapes, and tables."""
    blocks: List[str] = []
    for child in sp_tree:
        tag = child.tag.split("}")[-1]
        if tag == "sp":
            # Optionally skip slide number placeholder
            if skip_sld_num:
                ph = child.find(".//p:nvPr/p:ph", NS)
                if ph is not None and ph.attrib.get("type") in ("sldNum", "ftr", "dt"):
                    continue
            txbody = child.find("p:txBody", NS)
            if txbody is not None:
                paras = extract_txbody(txbody)
                for txt, lvl in paras:
                    indent = "  " * min(lvl, 4)
                    # Format multi-line paragraph cleanly
                    for i, ln in enumerate(txt.split("\n")):
                        prefix = f"{indent}- " if (lvl > 0 and i == 0 and not ln.startswith(("-", "+", "•", "►"))) else indent
                        blocks.append(f"{prefix}{ln}")
        elif tag == "grpSp":
            blocks.extend(extract_shape_tree(child, skip_sld_num=skip_sld_num))
        elif tag == "graphicFrame":
            tbl = child.find(".//a:tbl", NS)
            if tbl is not None:
                tbl_lines = extract_table(tbl)
                if tbl_lines:
                    blocks.append("")
                    blocks.extend(tbl_lines)
                    blocks.append("")
    return blocks


def extract_diagram_data(z: zipfile.ZipFile, diagram_path: str) -> List[str]:
    """Extract text from SmartArt diagrams/data*.xml."""
    if diagram_path not in z.namelist():
        return []
    root = ET.fromstring(z.read(diagram_path))
    items: List[str] = []
    seen = set()
    for pt in root.findall(".//dgm:ptLst/dgm:pt", NS):
        t_el = pt.find("dgm:t", NS)
        if t_el is None:
            continue
        paras = extract_txbody(t_el)
        if not paras:
            continue
        joined = " — ".join(txt.replace("\n", " ") for txt, _ in paras)
        if joined and joined not in seen:
            seen.add(joined)
            items.append(f"- {joined}")
    return items


def extract_notes(z: zipfile.ZipFile, notes_path: str) -> List[str]:
    """Extract speaker notes from notesSlide*.xml, skipping slide number."""
    if notes_path not in z.namelist():
        return []
    root = ET.fromstring(z.read(notes_path))
    sp_tree = root.find(".//p:cSld/p:spTree", NS)
    if sp_tree is None:
        return []
    lines = extract_shape_tree(sp_tree, skip_sld_num=True)
    # Filter out bare numeric strings that are just slide numbers
    return [ln for ln in lines if ln.strip() and not re.fullmatch(r"\d+", ln.strip())]


# Post-extraction normalization for hybrid-font artifacts and legacy Unikey/VNI
# conversion glitches present in the source slides (e.g. "oa" -> "ô", "ẨuTụ").
POST_REPLACEMENTS: List[Tuple[str, str]] = [
    ("ẨuTụ sở của EU tại Strasbourg, Pháp", "Trụ sở của EU tại Strasbourg, Pháp"),
    ("Hồn cảnh lịch sử", "Hoàn cảnh lịch sử"),
    ("hồn tồn độc lập", "hoàn toàn độc lập"),
    ("hồn tồn giải phóng", "hoàn toàn giải phóng"),
    ("hồn chỉnh", "hoàn chỉnh"),
    ("hồn thành", "hoàn thành"),
    ("Hồn thành", "Hoàn thành"),
    ("HỒN\nTHÀNH", "HOÀN\nTHÀNH"),
    ("tồn thể công nhân", "toàn thể công nhân"),
    ("đồn đại biểu", "đoàn đại biểu"),
    ("tồn quốc kháng chiến", "toàn quốc kháng chiến"),
    ("Tồn quốc kháng chiến", "Toàn quốc kháng chiến"),
    ("Tồn dân kháng chiến", "Toàn dân kháng chiến"),
    ("Tồn dân, tồn diện", "Toàn dân, toàn diện"),
    ("tồn dân, tồn diện", "toàn dân, toàn diện"),
    ("Đoàn kết tồn dân", "Đoàn kết toàn dân"),
    ("đại biểu tồn quốc", "đại biểu toàn quốc"),
    ("chiến lược tồn cầu", "chiến lược toàn cầu"),
    ("dân chủ và hồ bình", "dân chủ và hòa bình"),
    ("hòa hỗn Chủ tịch", "hòa hoãn Chủ tịch"),
    ("hiện ước Patonot", "Hiệp ước Patơnốt"),
    ("Sài Gồn", "Sài Gòn"),
    ("Đảng Công sản Việt Nam", "Đảng Cộng sản Việt Nam"),
    ("thành kiến cung đột cũ", "thành kiến xung đột cũ"),
    ("Tòan tập", "Toàn tập"),
    ("việc thành Đảng Cộng sản Việt Nam", "việc thành lập Đảng Cộng sản Việt Nam"),
    ("trog sản xuất", "trong sản xuất"),
    ("bí mất đưa vào", "bí mật đưa vào"),
    ("Hoàn cảnh lịnh sử", "Hoàn cảnh lịch sử"),
    ("ĐẠI HÔI VII", "ĐẠI HỘI VII"),
    ("muồn đánh đổ", "muốn đánh đổ"),
    ("tinh tần độc lập", "tinh thần độc lập"),
    ("Đảng dã chỉ đạo", "Đảng đã chỉ đạo"),
    ("lưc lượng vũ trang", "lực lượng vũ trang"),
    ("diên ra sôi nổi", "diễn ra sôi nổi"),
    ("các nước Đồng mình", "các nước Đồng minh"),
    ("quốc thuổng", "cuốc thuổng"),
    ("chiến hạn Mitsuri", "chiến hạm Missouri"),
    ("KHAI HÓA, KẾT QUẢ", "KHAI HOA, KẾT QUẢ"),
    ("Hàn gắn vết hương", "Hàn gắn vết thương"),
    ("giải phòng miền Nam khỏi ánh thống trị", "giải phóng miền Nam khỏi ách thống trị"),
    ("ngày 27-l-1973", "ngày 27-1-1973"),
    ("đánhTân Sơn Nhất", "đánh Tân Sơn Nhất"),
    ("khế hoạch hóa", "kế hoạch hóa"),
    ("chương chình mục tiêu", "chương trình mục tiêu"),
    ("các nghành", "các ngành"),
    ("giai doạn mới", "giai đoạn mới"),
    ("Đại hội IX xác đinh", "Đại hội IX xác định"),
    ("xắp xếp", "sắp xếp"),
    ("Dân tộc, hện đại, nhân văn", "Dân tộc, hiện đại, nhân văn"),
    ("chinh sách XH", "chính sách XH"),
    ("quan hệ ngiao", "quan hệ ngoại giao"),
    ("việt nam - HOA KỲ", "VIỆT NAM - HOA KỲ"),
    ("việt nam - trung hoA", "VIỆT NAM - TRUNG HOA"),
    ("vIỆT NAM - ASEAN", "VIỆT NAM - ASEAN"),
    ("việt nam - ASEAN", "VIỆT NAM - ASEAN"),
    ("Liêp Hợp Quốc", "Liên Hợp Quốc"),
    ("Liên Hơp Quốc", "Liên Hợp Quốc"),
    ("Kofi Anal", "Kofi Annan"),
    ("TỔ CHỨC CuỘC BÃI CÔNG", "TỔ CHỨC CUỘC BÃI CÔNG"),
]


def post_normalize_vietnamese(text: str) -> str:
    res = text
    for src, dst in POST_REPLACEMENTS:
        res = res.replace(src, dst)
    # Also fix standalone "HỒN" line right before "THÀNH CMDTDC"
    res = res.replace("\nHỒN\nTHÀNH CMDTDC", "\nHOÀN\nTHÀNH CMDTDC")
    return res


def extract_pptx_to_md(pptx_path: Path, output_md: Path, chapter_label: str) -> Tuple[int, List[Tuple[int, str]]]:
    """Extract entire PPTX into a clean Markdown file and return (slide_count, suspicious_lines)."""
    md_parts: List[str] = [f"# {chapter_label}", f"_Nguồn: `{pptx_path.name}`_", ""]
    suspicious: List[Tuple[int, str]] = []

    with zipfile.ZipFile(pptx_path, "r") as z:
        slides = get_ordered_slides(z)
        for idx, slide_path in enumerate(slides, start=1):
            slide_name = os.path.basename(slide_path)
            rels_path = f"ppt/slides/_rels/{slide_name}.rels"
            rels = parse_rels(z, rels_path)

            root = ET.fromstring(z.read(slide_path))
            sp_tree = root.find(".//p:cSld/p:spTree", NS)
            slide_lines = extract_shape_tree(sp_tree, skip_sld_num=True) if sp_tree is not None else []

            # SmartArt diagrams referenced by this slide
            diag_lines: List[str] = []
            notes_lines: List[str] = []
            for _, (rtype, target) in rels.items():
                if "diagramData" in rtype:
                    dpath = resolve_ppt_path("ppt/slides", target)
                    diag_lines.extend(extract_diagram_data(z, dpath))
                elif "notesSlide" in rtype:
                    npath = resolve_ppt_path("ppt/slides", target)
                    notes_lines.extend(extract_notes(z, npath))

            md_parts.append(f"## Slide {idx}")
            if slide_lines:
                md_parts.extend(slide_lines)
            if diag_lines:
                md_parts.append("")
                md_parts.append("### Sơ đồ (SmartArt)")
                md_parts.extend(diag_lines)
            if notes_lines:
                md_parts.append("")
                md_parts.append("### Ghi chú diễn giả")
                md_parts.extend(notes_lines)
            if not slide_lines and not diag_lines and not notes_lines:
                md_parts.append("_(Slide hình ảnh / không có văn bản)_")
            md_parts.append("")

            # Audit lines for any remaining garbled TCVN3/VNI characters
            for ln in slide_lines + diag_lines + notes_lines:
                if any(ch in TCVN3_EXTRA_SIG for ch in ln) or (
                    not is_already_unicode_vi(ln) and bool(VNI_PATTERN.search(ln))
                ):
                    suspicious.append((idx, ln[:120]))

    output_md.parent.mkdir(parents=True, exist_ok=True)
    final_md = post_normalize_vietnamese("\n".join(md_parts))
    output_md.write_text(final_md, encoding="utf-8")
    return len(slides), suspicious


def main() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    docs_dir = root_dir / "docs"
    pptx_files = sorted(docs_dir.glob("*.pptx"))
    if not pptx_files:
        print("Không tìm thấy file .pptx nào trong docs/", file=sys.stderr)
        sys.exit(1)

    chapter_meta = {
        1: ("docs/extracted_c1.md", "Chương 1: Đảng Cộng sản Việt Nam ra đời và lãnh đạo đấu tranh giành chính quyền (1930 - 1945)"),
        2: ("docs/extracted_c2.md", "Chương 2: Đảng lãnh đạo hai cuộc kháng chiến, hoàn thành giải phóng dân tộc, thống nhất đất nước (1945 - 1975)"),
        3: ("docs/extracted_c3.md", "Chương 3: Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội và tiến hành công cuộc đổi mới (1975 - nay)"),
    }

    for p in pptx_files:
        m = re.search(r"chuong\s*([123])", p.name, re.IGNORECASE)
        if not m:
            print(f"Bỏ qua file không khớp chương 1-3: {p.name}")
            continue
        chap = int(m.group(1))
        rel_out, label = chapter_meta[chap]
        out_path = root_dir / rel_out
        count, suspicious = extract_pptx_to_md(p, out_path, label)
        print(f"[OK] {p.name} -> {rel_out} ({count} slides, {len(suspicious)} dòng cần kiểm tra)")
        for s_idx, s_txt in suspicious[:20]:
            print(f"   ! Slide {s_idx}: {s_txt}")


if __name__ == "__main__":
    main()
