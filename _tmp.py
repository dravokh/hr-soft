from pathlib import Path
path = Path('src/pages/MyPage.tsx')
text = path.read_text(encoding='utf-8')
# replace first occurrence (Georgian)
text, count = __import__('re').subn(r"(deductionsLabel: )'[^']*'", r"\1'???????????? ?? ??????????'", text, count=1)
if count == 0:
    raise SystemExit('Georgian deductionsLabel not found')
text, count = __import__('re').subn(r"(deductionsLabel: )'[^']*'", r"\1'T\axes & deductions'", text, count=1)
