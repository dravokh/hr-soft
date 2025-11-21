from pathlib import Path
path = Path('src/pages/UsersPage.tsx')
text = path.read_text('utf-8')
block_end = text.index('\n  },\n  en: {')
insert_pos = text.rindex('\n', 0, block_end)
# ensure we are right before closing braces for ka block
before = text[:block_end]
after = text[block_end:]
if 'workScheduleTitle:' in before[-500:]:
    # already inserted
    exit()
addition = '''    workScheduleTitle: "სამუშაო განრიგი",
    workScheduleDescription: "განსაზღვრეთ სამუშაო დღეები, დროები და შესვენებები.",
    workScheduleButton: "განრიგის შეცვლა",
    workScheduleModalTitle: "სამუშაო გრაფიკის რედაქტირება",
    workScheduleWorkingDay: "სამუშაო დღე",
    workScheduleDayOff: "დასვენების დღე",
    workScheduleStartLabel: "დაწყების დრო",
    workScheduleEndLabel: "დასრულების დრო",
    workScheduleBreakLabel: "შესვენება (წთ)",
    workScheduleModalSave: "გრაფიკის შენახვა",
    workScheduleModalCancel: "დახურვა",
    workScheduleSummaryLabel: "კვირის დატვირთვა",
    workScheduleSelectedDays: "სამუშაო დღეები"
'''
before = before.rstrip()[:-1]  # remove last }
if not before.endswith(','):
    before = before + '\n'
before = before + addition + '  }'
text = before + after
path.write_text(text, 'utf-8')
