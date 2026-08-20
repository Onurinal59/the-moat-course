#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Müfredat markdown dosyalarını tek bir data/course.json dosyasına dönüştürür."""
import json, os, re, unicodedata
from collections import OrderedDict

SRC = "/home/user/workspace/curriculum"
OUT = "/home/user/workspace/moat-kursu/data/course.json"

PART_META = [
    {"id": "p1", "file": "part1.md", "no": 1,
     "title": "Değer Yaratma, Strateji ve Sektörün Haritası",
     "kisa": "Bölüm 1"},
    {"id": "p2", "file": "part2.md", "no": 2,
     "title": "Endüstri Yapısı, Giriş Engelleri ve Yıkım Riski",
     "kisa": "Bölüm 2"},
    {"id": "p3", "file": "part3.md", "no": 3,
     "title": "Firma Özgü Analiz ve Sürdürülebilir Değer Yaratma",
     "kisa": "Bölüm 3"},
]

LABELS = OrderedDict([
    ("ozet", "Tek cümlede özü"),
    ("neden", "Neden önemli (yatırımcı için)"),
    ("aciklama", "Kavramın açılımı"),
    ("formuller", "Formüller"),
    ("ornek", "Sayısal örnek"),
    ("kanit", "Dokümandaki kanıt/örnekler"),
    ("hatalar", "Sık yapılan 2 hata"),
    ("sorular", "Kendine sor (2-3 analiz sorusu)"),
    ("kontrolListesi", "Kontrol listesi"),
])
LABEL_LOOKUP = {v: k for k, v in LABELS.items()}
LABEL_RE = re.compile(r"^\*\*(" + "|".join(re.escape(v) for v in LABELS.values()) + r"):?\*\*:?\s*(.*)$")


def clean_math(text):
    """LaTeX inline matematiği okunabilir düz metne çevirir."""
    def fix(m):
        s = m.group(1)
        s = s.replace("\\dfrac", "\\frac")
        s = re.sub(r"\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}", r"(\1) / (\2)", s)
        s = s.replace("\\times", "×").replace("\\div", "÷").replace("\\cdot", "·")
        s = s.replace("\\approx", "≈").replace("\\leq", "≤").replace("\\geq", "≥")
        s = s.replace("\\%", "%").replace("{,}", ",").replace("\\ ", " ")
        s = s.replace("\\left", "").replace("\\right", "")
        s = s.replace("{", "").replace("}", "")
        s = re.sub(r"\s+", " ", s).strip()
        return "`" + s + "`"
    text = re.sub(r"\\\((.+?)\\\)", fix, text, flags=re.S)
    text = re.sub(r"\\\[(.+?)\\\]", fix, text, flags=re.S)
    return text


def norm(text):
    text = clean_math(text)
    text = text.replace("  \n", "\n")
    return text.strip()


def split_blocks(raw):
    """Etiket bloklarını (label -> ham metin) sırayla döndürür."""
    lines = raw.split("\n")
    blocks = []
    current = None
    for line in lines:
        m = LABEL_RE.match(line.strip())
        if m:
            key = LABEL_LOOKUP[m.group(1)]
            current = {"key": key, "lines": []}
            rest = m.group(2).strip()
            if rest:
                current["lines"].append(rest)
            blocks.append(current)
        elif current is not None:
            current["lines"].append(line)
    return blocks


def paragraphs(lines):
    text = "\n".join(lines)
    parts = [norm(p) for p in re.split(r"\n\s*\n", text)]
    return [p for p in parts if p]


def bullets(lines):
    """Madde işaretli ya da numaralı satırları liste olarak döndürür (çok satırlı devam destekli)."""
    items = []
    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            continue
        m = re.match(r"^\s*(?:[-*•]|\d+[.)])\s+(.*)$", line)
        if m:
            items.append(norm(m.group(1)))
        else:
            if items:
                items[-1] = norm(items[-1] + " " + line.strip())
            else:
                items.append(norm(line.strip()))
    return [i for i in items if i]


def mixed(lines):
    """Bazı bloklar hem paragraf hem madde içerir; sırayı koruyan blok listesi üretir."""
    out = []
    buf = []
    for raw in lines:
        line = raw.rstrip()
        is_item = bool(re.match(r"^\s*(?:[-*•]|\d+[.)])\s+", line))
        if is_item:
            if buf:
                for p in paragraphs(buf):
                    out.append({"tip": "p", "metin": p})
                buf = []
            out.append({"tip": "li", "metin": norm(re.sub(r"^\s*(?:[-*•]|\d+[.)])\s+", "", line))})
        elif line.strip() == "":
            buf.append(line)
        else:
            if out and out[-1]["tip"] == "li" and not buf:
                out[-1]["metin"] = norm(out[-1]["metin"] + " " + line.strip())
            else:
                buf.append(line)
    if buf:
        for p in paragraphs(buf):
            out.append({"tip": "p", "metin": p})
    return out


def parse_modules(body, part_id, part_no):
    """### Modül başlıklarına göre bölünür."""
    chunks = re.split(r"\n(?=### Modül )", body)
    modules = []
    for chunk in chunks:
        m = re.match(r"### Modül\s+(\d+)\s*[—–-]\s*(.+)", chunk.strip().split("\n")[0])
        if not m:
            continue
        no = int(m.group(1))
        title = m.group(2).strip()
        rest = "\n".join(chunk.strip().split("\n")[1:])
        blocks = split_blocks(rest)
        mod = {
            "id": "%s-m%d" % (part_id, no),
            "part": part_id,
            "partNo": part_no,
            "no": no,
            "title": norm(title),
            "ozet": "",
            "neden": "",
            "aciklama": [],
            "formuller": [],
            "ornek": "",
            "kanit": [],
            "hatalar": [],
            "sorular": [],
            "kontrolListesi": [],
        }
        for b in blocks:
            k, lines = b["key"], b["lines"]
            if k == "ozet":
                mod["ozet"] = " ".join(paragraphs(lines))
            elif k == "neden":
                mod["neden"] = " ".join(paragraphs(lines))
            elif k == "aciklama":
                mod["aciklama"] = paragraphs(lines)
            elif k == "formuller":
                mod["formuller"] = mixed(lines)
            elif k == "ornek":
                mod["ornek"] = "\n\n".join(paragraphs(lines))
            elif k == "kanit":
                mod["kanit"] = mixed(lines)
            elif k == "hatalar":
                mod["hatalar"] = bullets(lines)
            elif k == "sorular":
                mod["sorular"] = bullets(lines)
            elif k == "kontrolListesi":
                mod["kontrolListesi"] = bullets(lines)
        modules.append(mod)
    return modules


def parse_quiz(section, part_id):
    out = []
    if not section:
        return out
    items = re.split(r"\n(?=-\s+S:)", section.strip())
    for it in items:
        lines = [l.strip() for l in it.strip().split("\n") if l.strip()]
        if not lines or not lines[0].startswith("- S:"):
            continue
        soru = norm(lines[0][4:].strip())
        secenekler, dogru, aciklama = [], None, ""
        for l in lines[1:]:
            l = l.strip().strip("*").strip()
            mo = re.match(r"^([A-D])\)\s*(.*)$", l)
            md = re.match(r"^\*{0,2}Doğru:?\*{0,2}\s*\*{0,2}\s*([A-D])", l)
            ma = re.match(r"^\*{0,2}Açıklama:?\*{0,2}\s*(.*)$", l)
            if mo:
                secenekler.append(norm(mo.group(2).strip()))
            elif md:
                dogru = "ABCD".index(md.group(1))
            elif ma:
                aciklama = norm(ma.group(1).strip())
            elif aciklama:
                aciklama = norm(aciklama + " " + l)
        assert len(secenekler) == 4, (part_id, soru, secenekler)
        assert dogru is not None, (part_id, soru)
        out.append({"soru": soru, "secenekler": secenekler, "dogru": dogru,
                    "aciklama": aciklama, "part": part_id})
    return out


def parse_flashcards(section, part_id):
    out = []
    if not section:
        return out
    for line in section.strip().split("\n"):
        line = line.strip()
        if not line.startswith("- Ön:"):
            continue
        body = line[5:]
        if "| Arka:" in body:
            on, arka = body.split("| Arka:", 1)
        else:
            continue
        out.append({"on": norm(on.strip()), "arka": norm(arka.strip()), "part": part_id})
    return out


def parse_checklist(section):
    """Hiyerarşik kontrol listesi -> [{baslik, maddeler:[{metin, altMaddeler:[...]}]}]"""
    gruplar = []
    for raw in section.split("\n"):
        line = raw.rstrip()
        if not line.strip().startswith("-"):
            continue
        indent = len(line) - len(line.lstrip(" "))
        text = norm(re.sub(r"^\s*-\s+", "", line))
        text_plain = text.replace("**", "")
        if indent == 0:
            gruplar.append({"baslik": text_plain, "maddeler": []})
        elif indent == 2:
            if gruplar:
                gruplar[-1]["maddeler"].append({"metin": text_plain, "altMaddeler": []})
        else:
            if gruplar and gruplar[-1]["maddeler"]:
                gruplar[-1]["maddeler"][-1]["altMaddeler"].append(text_plain)
    return gruplar


TERM_RE = re.compile(
    r"([A-ZÇĞİÖŞÜÂÎÛa-zçğıöşüâîû’'\-]+(?:\s+[a-zçğıöşüâîû’'\-]+){0,5})\s*\(([a-zA-Z][a-zA-Z\-/’' ,\.]{2,60})\)")
STOP_EN = {"yatırımcı için", "2-3 analiz sorusu", "milk", "quantity/volume", "com"}
STOP_TR_FRONT = set(("ve ile ise veya ya bir bu şu o daha göreli yalnız ne de da ki için gibi olan "
                    "olarak hem çok tek kendi yine en mi ancak ayrıca ama fakat hangi her öte "
                    "çoğunlukla örneğin nedeniyle sonra önce üzerinden arasındaki oysa böylece "
                    "dolayısıyla yani artık hep tüm bütün burada şöyle şimdi hatta belki mutlaka "
                    "özellikle genellikle tipik yüksek düşük ikinci birinci").split())


GLOSSARY_BLACKLIST = {"genai", "fiyat-maliyet", "maliyet-wts", "wtp-fiyat", "module", "activities"}
GLOSSARY_OVERRIDES = {
    "outsourcing": "dış kaynak kullanımı",
    "productivity": "verimlilik",
    "non-consumption": "tüketmeme",
    "multi-homing": "çoklu bağlantı",
    "service-oriented architecture": "hizmet odaklı mimari",
    "precommitment contracts": "ön taahhüt sözleşmeleri",
    "lock-in": "kilitlenme",
    "product-market fit": "ürün–pazar uyumu",
    "connectivity": "bağlantılılık",
    "dedicated assets": "tahsis edilmiş varlıklar",
    "invested capital": "yatırılmış sermaye",
    "invested capital turnover": "yatırılmış sermaye devir hızı",
    "network effects": "ağ etkileri",
    "efficient scale": "verimli ölçek",
    "experience goods": "deneyim malları",
    "supply-side economies of scale": "arz tarafı ölçek ekonomileri",
    "value drivers": "değer sürücüleri",
    "value system": "değer sistemi",
    "five forces framework": "Beş Güç çerçevesi",
    "adjusted for internally-generated intangible assets":
        "içsel yaratılmış maddi olmayan varlıklara göre düzeltilmiş",
    "dupont decomposition": "DuPont ayrıştırması (ROIC ağacı)",
    "economic profit": "ekonomik kâr",
    "net operating profit after taxes": "vergi sonrası net faaliyet kârı",
    "net operating profit after taxes, nopat": "vergi sonrası net faaliyet kârı",
    "return on invested capital": "yatırılmış sermaye getirisi",
    "weighted average cost of capital": "ağırlıklı ortalama sermaye maliyeti",
    "weighted average cost of capital, wacc": "ağırlıklı ortalama sermaye maliyeti",
    "willingness to pay, wtp": "ödemeye isteklilik",
    "willingness to sell, wts": "satmaya isteklilik",
    "switching costs": "geçiş maliyetleri",
    "mini-mills": "mini fabrikalar",
    "antitrust": "rekabet hukuku",
    "upstream": "yukarı yönlü",
    "downstream": "aşağı yönlü",
    "steady-state value": "durağan durum değeri",
    "low-end disruption": "düşük uç yıkımı",
    "new-market disruption": "yeni pazar yıkımı",
    "positive feedback": "pozitif geri besleme",
    "quasi-contracts": "yarı sözleşmeler",
    "threat of substitutes": "ikame tehdidi",
    "human specificity": "insan özgüllüğü",
    "agency costs": "vekâlet maliyetleri",
    "horizontal differentiation": "yatay farklılaşma",
    "linking and leveraging": "bağlama ve kaldıraçlama",
    "minimum efficient scale, mes": "minimum etkin ölçek",
    "product life cycle": "ürün yaşam döngüsü",
    "welfare loss": "refah kaybı",
    "value net": "değer ağı",
    "value network": "değer ağı (iş modeli ekosistemi)",
    "operating leverage": "faaliyet kaldıracı",
}


def tr_capitalize(s):
    if not s:
        return s
    first = s[0]
    first = "İ" if first == "i" else first.upper()
    return first + s[1:]


def build_glossary(modules):
    terms = {}
    for mod in modules:
        texts = [mod["ozet"], mod["neden"], mod["ornek"]] + mod["aciklama"] + \
                mod["hatalar"] + mod["sorular"] + mod["kontrolListesi"] + \
                [b["metin"] for b in mod["formuller"]] + [b["metin"] for b in mod["kanit"]]
        for t in texts:
            t = t.replace("**", "").replace("`", "")
            for m in TERM_RE.finditer(t):
                tr_raw = m.group(1).strip(" ,.;:")
                en = m.group(2).strip(" ,.;:")
                if not re.search(r"[a-z]", en):
                    continue
                if en.lower() in STOP_EN or re.search(r"[çğıöşüÇĞİÖŞÜ]", en):
                    continue
                if en.lower().startswith(("exhibit", "appendix")) or len(en.split()) > 6:
                    continue
                en_core = en.split(",")[0]
                n = max(1, len(en_core.split()))
                words = tr_raw.split()
                while words and words[0].lower() in STOP_TR_FRONT:
                    words.pop(0)
                if len(words) > n + 1:
                    words = words[-(n + 1):]
                while words and words[0].lower() in STOP_TR_FRONT:
                    words.pop(0)
                tr = " ".join(words)
                if len(tr) < 3:
                    continue
                key = en.lower()
                rec = terms.setdefault(key, {"en": en, "tr": {}, "modules": []})
                rec["tr"][tr] = rec["tr"].get(tr, 0) + 1
                if mod["id"] not in rec["modules"]:
                    rec["modules"].append(mod["id"])
    out = []
    for key, rec in terms.items():
        tr_list = sorted(rec["tr"].items(), key=lambda kv: (-kv[1], len(kv[0])))
        if key in GLOSSARY_BLACKLIST:
            continue
        best = GLOSSARY_OVERRIDES.get(key, tr_list[0][0])
        out.append({"en": rec["en"], "tr": tr_capitalize(best),
                    "digerKarsiliklar": [t for t, _ in tr_list[1:4] if t.lower() != best.lower()],
                    "modules": rec["modules"]})

    def sort_key(item):
        s = item["en"].lower()
        return s
    out.sort(key=sort_key)
    return out


def main():
    parts, modules, quiz, flashcards = [], [], [], []
    kontrol = []
    for meta in PART_META:
        raw = open(os.path.join(SRC, meta["file"]), encoding="utf-8").read()
        # üst başlık + giriş
        head_match = re.search(r"^# (.+)$", raw, flags=re.M)
        intro = ""
        first_mod = raw.find("\n### Modül ")
        head_end = raw.find("\n", raw.find("# "))
        intro_raw = raw[head_end:first_mod]
        intro_paras = [p for p in paragraphs(intro_raw.split("\n"))]
        intro = "\n\n".join(intro_paras)

        # bölümler
        def section(name):
            m = re.search(r"\n## " + re.escape(name) + r"\s*\n(.*?)(?=\n## |\Z)", raw, flags=re.S)
            return m.group(1) if m else ""

        body_end = len(raw)
        for nm in ["Tam Kontrol Listesi", "Quiz", "Flashcards"]:
            i = raw.find("\n## " + nm)
            if i != -1:
                body_end = min(body_end, i)
        body = raw[first_mod:body_end]
        mods = parse_modules(body, meta["id"], meta["no"])
        modules.extend(mods)
        quiz.extend(parse_quiz(section("Quiz"), meta["id"]))
        flashcards.extend(parse_flashcards(section("Flashcards"), meta["id"]))
        kl = section("Tam Kontrol Listesi")
        if kl.strip():
            note_m = re.search(r"^(?!-)(\S.*)$", kl.strip(), flags=re.M)
            kontrol = {"not": norm(note_m.group(1)) if note_m else "",
                       "gruplar": parse_checklist(kl)}
        parts.append({
            "id": meta["id"], "no": meta["no"],
            "baslik": meta["title"],
            "kisa": meta["kisa"],
            "giris": intro,
            "moduleIds": [m["id"] for m in mods],
        })

    glossary = build_glossary(modules)
    data = {
        "meta": {
            "baslik": "Hendeği Ölçmek",
            "altBaslik": "Measuring the Moat Kursu",
            "kaynak": "Michael J. Mauboussin & Dan Callahan, “Measuring the Moat”, Morgan Stanley Counterpoint Global, 15 Ekim 2024.",
            "modulSayisi": len(modules),
            "quizSayisi": len(quiz),
            "flashcardSayisi": len(flashcards),
        },
        "parts": parts,
        "modules": modules,
        "quiz": quiz,
        "flashcards": flashcards,
        "kontrolListesi": kontrol,
        "sozluk": glossary,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    # --- Doğrulama ---
    print("Bölüm sayısı        :", len(parts))
    print("Modül sayısı        :", len(modules), "(beklenen 44)")
    for p in parts:
        print("   %s -> %d modül" % (p["id"], len(p["moduleIds"])))
    print("Quiz soru sayısı    :", len(quiz), "(beklenen 26)")
    print("Flashcard sayısı    :", len(flashcards), "(beklenen 32)")
    print("Kontrol listesi grup:", len(kontrol["gruplar"]))
    tot = sum(len(g["maddeler"]) for g in kontrol["gruplar"])
    alt = sum(len(m["altMaddeler"]) for g in kontrol["gruplar"] for m in g["maddeler"])
    print("Kontrol listesi soru:", tot, "+ alt madde:", alt, "= ", tot + alt)
    print("Sözlük terim sayısı :", len(glossary))
    eksik = []
    for m in modules:
        if not m["ozet"] or not m["neden"] or not m["aciklama"] or not m["kanit"] \
                or not m["hatalar"] or not m["sorular"]:
            eksik.append(m["id"])
    print("Eksik alanlı modül  :", eksik if eksik else "yok")
    print("Formülü olan modül  :", sum(1 for m in modules if m["formuller"]))
    print("Örneği olan modül   :", sum(1 for m in modules if m["ornek"]))
    print("Kontrol listesi olan:", sum(1 for m in modules if m["kontrolListesi"]))
    print("JSON boyutu (KB)    : %.1f" % (os.path.getsize(OUT) / 1024))
    assert len(modules) == 44 and len(quiz) == 26 and len(flashcards) == 32


if __name__ == "__main__":
    main()
