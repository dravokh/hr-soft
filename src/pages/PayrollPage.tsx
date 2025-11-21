import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import type { PayrollBatch, PayrollItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { fetchPayrollBatch } from '../services/api';

type PayrollPageProps = {
  language: 'ka' | 'en';
};

type TabId = 'drafts' | 'history' | 'stats';

const COPY = {
  ka: {
    title: 'ხელფასები',
    subtitle: 'შექმენი, გადახედე და დაადასტურე ყოველთვიური სიის მიხედვით.',
    createTitle: 'ახალი ანაზღაურება',
    monthLabel: 'აირჩიეთ თვე',
    createAction: 'გენერაცია',
    statusDraft: 'დრაფტი',
    statusReview: 'გადახედვა',
    statusFinal: 'დაფიქსირებული',
    draftsTab: 'დრაფტები',
    historyTab: 'ისტორია',
    statsTab: 'სტატისტიკა',
    emptyMessage: 'ამ სტატუსში ჩანაწერი არ იძებნება.',
    viewDetails: 'დეტალები',
    moveToReview: 'გადაგზავნა განხილვაზე',
    finalize: 'დაფიქსირება',
    export: 'გატანა',
    gross: 'ბრუტო',
    net: 'სუფთა',
    tax: 'გადასახადი',
    deductions: 'დაქვითვები',
    totals: 'საერთო მაჩვენებლები',
    batchTotals: 'ბეჭდის მაჩვენებლები',
    itemsTitle: 'თანამშრომლები',
    noItems: 'ელემენტები ვერ მოიძებნა.',
    statsCards: {
      batches: 'სულ ბარათები',
      gross: 'ჯამური ბრუტო',
      net: 'ჯამური სუფთა',
      taxes: 'გადასახადები',
      deductions: 'დაქვითვები'
    },
    manageNotice: 'ანგარიშის შექმნა და დადასტურება მხოლოდ უფლებამოსილ პირებს შეუძლიათ.',
    exportCsv: 'CSV',
    exportXlsx: 'XLSX',
    exportPdf: 'PDF',
    created: 'შეიქმნა'
  },
  en: {
    title: 'Payroll workspace',
    subtitle: 'Generate, review, and finalize payroll runs using live data.',
    createTitle: 'New payroll run',
    monthLabel: 'Select month',
    createAction: 'Generate',
    statusDraft: 'Draft',
    statusReview: 'In review',
    statusFinal: 'Finalized',
    draftsTab: 'Drafts',
    historyTab: 'History',
    statsTab: 'Statistics',
    emptyMessage: 'No batches match this filter.',
    viewDetails: 'Details',
    moveToReview: 'Send to review',
    finalize: 'Finalize',
    export: 'Export',
    gross: 'Gross',
    net: 'Net',
    tax: 'Tax',
    deductions: 'Deductions',
    totals: 'Global totals',
    batchTotals: 'Batch overview',
    itemsTitle: 'Employees',
    noItems: 'No payroll items found.',
    statsCards: {
      batches: 'Total batches',
      gross: 'Gross total',
      net: 'Net total',
      taxes: 'Taxes withheld',
      deductions: 'Deductions'
    },
    manageNotice: 'Only authorized roles may generate or finalize payroll runs.',
    exportCsv: 'CSV',
    exportXlsx: 'XLSX',
    exportPdf: 'PDF',
    created: 'Created'
  }
} as const;

const DETAIL_COPY = {
  ka: {
    title: (name: string) => `${name} - ხელფასის დეტალები`,
    subtitle:
      'იხილეთ როგორ ჩამოყალიბდა საბოლოო ანაზღაურება: საბაზო ხელფასი, ბონუსები, გადასახადები და დაკლებები.',
    fields: {
      base: 'საბაზო ხელფასი',
      lessons: 'გაკვეთილების ბონუსები',
      catalog: 'დამატებითი ბონუსები',
      extra: 'სხვა ბონუსები',
      gross: 'ჯამური ხელფასი',
      tax: 'გადასახადი',
      deduction: 'დაკლება',
      net: 'საბოლოო ანაზღაურება'
    },
    lessonSummary: {
      title: 'გაკვეთილების სტატისტიკა',
      cambridge: 'კემბრიჯის გაკვეთილები',
      georgian: 'ქართული გაკვეთილები'
    },
    selectedBonuses: 'არჩეული ბონუსები',
    noBonuses: 'ბონუსები არჩეული არ არის',
    close: 'დახურვა',
    clickHint: 'ხელფასის დეტალების სანახავად დააკლიკეთ თანამშრომლის სტრიქონს.'
  },
  en: {
    title: (name: string) => `Salary breakdown – ${name}`,
    subtitle:
      'Understand how we calculated the final salary: base pay, lesson bonuses, catalog bonuses, taxes, and deductions.',
    fields: {
      base: 'Base salary',
      lessons: 'Lesson bonuses',
      catalog: 'Catalog bonuses',
      extra: 'Extra bonuses',
      gross: 'Gross total',
      tax: 'Tax withheld',
      deduction: 'Other deductions',
      net: 'Net pay'
    },
    lessonSummary: {
      title: 'Lesson summary',
      cambridge: 'Cambridge lessons',
      georgian: 'Georgian lessons'
    },
    selectedBonuses: 'Selected bonuses',
    noBonuses: 'No bonuses applied',
    breakdownTitle: 'Salary breakdown',
    penalties: 'Penalties',
    bonusesTotal: 'Bonuses (selected)',
    close: 'Close',
    clickHint: 'Click any employee row to inspect their detailed salary breakdown.'
  }
} as const;

const formatCurrency = (value: number, language: 'ka' | 'en') =>
  new Intl.NumberFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    style: 'currency',
    currency: 'GEL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

const numberOrNull = (value: unknown): number | null =>
  Number.isFinite(Number(value)) ? Number(value) : null;

const statusClasses: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  review: 'bg-sky-100 text-sky-700',
  finalized: 'bg-emerald-100 text-emerald-700'
};

export const PayrollPage: React.FC<PayrollPageProps> = ({ language }) => {
  const {
    compensationBonuses,
    payrollBatches,
    payrollStats,
    refreshPayrollBatches,
    refreshPayrollStats,
    createPayrollBatch,
    updatePayrollStatus,
    hasPermission,
    currentUser,
    users
  } = useAppContext();

  const copy = COPY[language];
  const detailCopy = DETAIL_COPY[language];
  const canManage = hasPermission('manage_payroll');
  const [activeTab, setActiveTab] = useState<TabId>('drafts');
  const [monthValue, setMonthValue] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const [creating, setCreating] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PayrollBatch | null>(null);
  const [batchDetails, setBatchDetails] = useState<PayrollBatch | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [extraModalOpen, setExtraModalOpen] = useState(false);

  const allowedUserIds = useMemo(() => new Set(users.map((user) => user.id)), [users]);

  const filterBatchForCampus = useCallback(
    (batch: PayrollBatch): PayrollBatch => {
      const items = (batch.items ?? []).filter((item) => allowedUserIds.has(item.userId));
      if (!items.length) {
        return { ...batch, items: [] };
      }

      const totals = items.reduce(
        (acc, item) => {
          acc.grossTotal += item.grossAmount;
          acc.taxTotal += item.taxAmount;
          acc.deductionTotal += item.deductionAmount;
          acc.netTotal += item.netAmount;
          return acc;
        },
        { grossTotal: 0, taxTotal: 0, deductionTotal: 0, netTotal: 0 }
      );

      return {
        ...batch,
        items,
        grossTotal: totals.grossTotal,
        taxTotal: totals.taxTotal,
        deductionTotal: totals.deductionTotal,
        netTotal: totals.netTotal
      };
    },
    [allowedUserIds]
  );
  const [lessonModalOpen, setLessonModalOpen] = useState(false);

  useEffect(() => {
    void refreshPayrollBatches();
    void refreshPayrollStats();
  }, [refreshPayrollBatches, refreshPayrollStats]);

  useEffect(() => {
    setSelectedItem(null);
  }, [batchDetails?.id]);

  const bonusNameMap = useMemo(() => {
    const map = new Map<number, string>();
    const traverse = (nodes: typeof compensationBonuses) => {
      nodes.forEach((node) => {
        map.set(node.id, node.name);
        if (node.children?.length) {
          traverse(node.children);
        }
      });
    };
    traverse(compensationBonuses ?? []);
    return map;
  }, [compensationBonuses]);

  const selectedMetadata = useMemo(() => {
    if (!selectedItem) {
      return {
        name: '',
        bonusIds: [] as number[]
      };
    }
    const metadata = (selectedItem.metadata ?? {}) as Record<string, unknown>;
    const rawName = metadata.userName;
    const resolvedName =
      typeof rawName === 'string' && rawName.trim().length > 0
        ? rawName.trim()
        : `#${selectedItem.userId}`;
    const bonusIdsRaw = metadata.selectedBonusIds;
    const bonusIds = Array.isArray(bonusIdsRaw)
      ? bonusIdsRaw.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [];
    return {
      name: resolvedName,
      bonusIds
    };
  }, [selectedItem]);

  const selectedFacts = useMemo(() => {
    if (!selectedItem) {
      return {
        cambridgeRate: null as number | null,
        georgianRate: null as number | null,
        extraMinutes: null as number | null,
        extraRate: null as number | null,
      taxRate: null as number | null,
      deductionsNote: '',
        bonusBreakdown: [] as { id?: number; name?: string; amount?: number }[],
        penaltyMinutes: null as number | null,
        penaltyAmount: null as number | null,
        bonusTotal: 0,
        metadataJson: '{}'
      };
    }

    const metadata = (selectedItem.metadata ?? {}) as Record<string, unknown>;

    const bonusBreakdownRaw = metadata['bonusBreakdown'];
    const bonusBreakdown: { id?: number; name?: string; amount?: number }[] = [];
    if (Array.isArray(bonusBreakdownRaw)) {
      bonusBreakdownRaw.forEach((entry) => {
        if (typeof entry !== 'object' || entry === null) return;
        const id = numberOrNull((entry as Record<string, unknown>).id ?? null) ?? undefined;
        const name =
          typeof (entry as Record<string, unknown>).name === 'string'
            ? ((entry as Record<string, unknown>).name as string)
            : undefined;
        const amount = numberOrNull((entry as Record<string, unknown>).amount) ?? undefined;
        if (id !== undefined || name !== undefined || amount !== undefined) {
          bonusBreakdown.push({ id, name, amount });
        }
      });
    }

    const metadataJson = JSON.stringify(metadata, null, 2);

    return {
      cambridgeRate: numberOrNull(metadata['cambridgeRate'] ?? metadata['cambridgePrice']),
      georgianRate: numberOrNull(metadata['georgianRate'] ?? metadata['georgianPrice']),
      extraMinutes: numberOrNull(metadata['extraMinutes'] ?? metadata['extra_minutes'] ?? metadata['extraHours']),
      extraRate: numberOrNull(metadata['extraRate'] ?? metadata['extra_rate'] ?? metadata['extraHourly']),
      taxRate: numberOrNull(metadata['taxRate']),
      deductionsNote: typeof metadata['deductionNote'] === 'string' ? (metadata['deductionNote'] as string) : '',
      bonusBreakdown,
      penaltyMinutes: numberOrNull(metadata['penaltyMinutes']),
      penaltyAmount: numberOrNull(metadata['penaltyAmount'] ?? metadata['penalty_sum']),
      bonusTotal: bonusBreakdown.reduce((sum, entry) => sum + (entry.amount ?? 0), 0),
      metadataJson
    };
  }, [selectedItem]);

  const selectedExtras = useMemo(() => {
    if (!selectedItem) {
      return [];
    }
    const metadata = (selectedItem.metadata ?? {}) as Record<string, unknown>;
    const entriesRaw =
      metadata['extraDetails'] ??
      metadata['extraEntries'] ??
      metadata['extra_hours'] ??
      metadata['extraHoursEntries'];
    if (!Array.isArray(entriesRaw)) {
      return [];
    }
    const parseString = (value: unknown): string | null =>
      typeof value === 'string' && value.trim() ? value.trim() : null;

    return entriesRaw
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null) return null;
        const record = entry as Record<string, unknown>;
        return {
          date: parseString(record.date),
          start: parseString(record.start ?? record.from),
          end: parseString(record.end ?? record.to),
          minutes: numberOrNull(record.minutes ?? record.duration),
          applicationNumber: parseString(record.applicationNumber ?? record.application)
        };
      })
      .filter(
        (entry): entry is {
          date: string | null;
          start: string | null;
          end: string | null;
          minutes: number | null;
          applicationNumber: string | null;
        } => Boolean(entry)
      );
  }, [selectedItem]);

  const batchesByTab = useMemo(() => {
    if (activeTab === 'drafts') {
      return payrollBatches.filter((batch) => batch.status !== 'finalized');
    }
    if (activeTab === 'history') {
      return payrollBatches.filter((batch) => batch.status === 'finalized');
    }
    return payrollBatches;
  }, [activeTab, payrollBatches]);

  const handleCreate = async () => {
    if (!monthValue) return;
    setCreating(true);
    setError(null);
    try {
      const batch = await createPayrollBatch(monthValue);
      const scoped = filterBatchForCampus(batch);
      setSelectedBatch(scoped);
      setBatchDetails(scoped);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to generate payroll.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectBatch = async (batch: PayrollBatch) => {
    setSelectedBatch(filterBatchForCampus(batch));
    setDetailsLoading(true);
    setError(null);
    try {
      const response = await fetchPayrollBatch(batch.id);
      setBatchDetails(filterBatchForCampus(response.batch));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to load payroll details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (batch: PayrollBatch, status: 'review' | 'finalized') => {
    setError(null);
    try {
      const updated = await updatePayrollStatus(batch.id, status);
      if (updated) {
        const scoped = filterBatchForCampus(updated);
        setSelectedBatch(scoped);
        setBatchDetails(scoped);
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to update payroll status.');
    }
  };

  const handleExportCsv = () => {
    if (!batchDetails?.items) return;
    const headers = [
      'Employee',
      'Base salary',
      'Lesson bonus',
      'Selected bonuses',
      'Extra bonus',
      'Gross',
      'Tax',
      'Deductions',
      'Net'
    ];
    const rows = batchDetails.items.map((item) => [
      String((item.metadata as Record<string, unknown>)?.userName ?? item.userId),
      item.baseSalary.toFixed(2),
      item.lessonBonus.toFixed(2),
      item.catalogBonus.toFixed(2),
      item.extraBonus.toFixed(2),
      item.grossAmount.toFixed(2),
      item.taxAmount.toFixed(2),
      item.deductionAmount.toFixed(2),
      item.netAmount.toFixed(2)
    ]);
    const csv = [headers, ...rows].map((line) => line.join(',')).join('\n');
    downloadBlob(csv, 'text/csv', `payroll-${batchDetails.payrollMonth}.csv`);
  };

  const handleExportSpreadsheet = () => {
    if (!batchDetails?.items) return;
    const rows = batchDetails.items
      .map((item) => {
        const name = (item.metadata as Record<string, unknown>)?.userName ?? item.userId;
        return `
          <Row>
            <Cell><Data ss:Type="String">${name}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.baseSalary.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.lessonBonus.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.catalogBonus.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.extraBonus.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.grossAmount.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.taxAmount.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.deductionAmount.toFixed(2)}</Data></Cell>
            <Cell><Data ss:Type="Number">${item.netAmount.toFixed(2)}</Data></Cell>
          </Row>
        `;
      })
      .join('');
    const xml = `<?xml version="1.0"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
        <Worksheet ss:Name="Payroll">
          <Table>
            <Row>
              <Cell><Data ss:Type="String">Employee</Data></Cell>
              <Cell><Data ss:Type="String">Base</Data></Cell>
              <Cell><Data ss:Type="String">Lesson</Data></Cell>
              <Cell><Data ss:Type="String">Bonuses</Data></Cell>
              <Cell><Data ss:Type="String">Extra</Data></Cell>
              <Cell><Data ss:Type="String">Gross</Data></Cell>
              <Cell><Data ss:Type="String">Tax</Data></Cell>
              <Cell><Data ss:Type="String">Deductions</Data></Cell>
              <Cell><Data ss:Type="String">Net</Data></Cell>
            </Row>
            ${rows}
          </Table>
        </Worksheet>
      </Workbook>`;
    downloadBlob(xml, 'application/vnd.ms-excel', `payroll-${batchDetails.payrollMonth}.xls`);
  };

  const handleExportPdf = () => {
    if (!batchDetails?.items) return;
    const doc = window.open('', '_blank', 'width=1024,height=768');
    if (!doc) {
      return;
    }
    const rows = batchDetails.items
      .map((item) => {
        const name = (item.metadata as Record<string, unknown>)?.userName ?? item.userId;
        return `<tr>
          <td>${name}</td>
          <td>${item.baseSalary.toFixed(2)}</td>
          <td>${item.lessonBonus.toFixed(2)}</td>
          <td>${item.catalogBonus.toFixed(2)}</td>
          <td>${item.extraBonus.toFixed(2)}</td>
          <td>${item.grossAmount.toFixed(2)}</td>
          <td>${item.taxAmount.toFixed(2)}</td>
          <td>${item.deductionAmount.toFixed(2)}</td>
          <td>${item.netAmount.toFixed(2)}</td>
        </tr>`;
      })
      .join('');
    doc.document.write(`
      <html>
        <head>
          <title>Payroll ${batchDetails.payrollMonth}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Payroll ${batchDetails.payrollMonth}</h2>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base</th>
                <th>Lesson</th>
                <th>Bonuses</th>
                <th>Extra</th>
                <th>Gross</th>
                <th>Tax</th>
                <th>Deductions</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    doc.document.close();
    doc.print();
  };

  const downloadBlob = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return copy.statusDraft;
      case 'review':
        return copy.statusReview;
      case 'finalized':
        return copy.statusFinal;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Banknote className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
            <p className="text-sm text-slate-500">{copy.subtitle}</p>
          </div>
        </div>
        {!canManage ? (
          <p className="text-xs text-slate-500">{copy.manageNotice}</p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{copy.createTitle}</h2>
            <p className="text-sm text-slate-500">{copy.monthLabel}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="month"
              value={monthValue}
              onChange={(event) => setMonthValue(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!canManage}
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canManage || creating}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {copy.createAction}
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-600">
          {(['drafts', 'history', 'stats'] as TabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1 ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab === 'drafts' ? copy.draftsTab : tab === 'history' ? copy.historyTab : copy.statsTab}
            </button>
          ))}
        </div>
        {activeTab === 'stats' ? (
          <div className="grid gap-4 pt-4 md:grid-cols-5">
            <StatCard
              label={copy.statsCards.batches}
              value={payrollStats?.totalBatches ?? 0}
              language={language}
            />
            <StatCard
              label={copy.statsCards.gross}
              value={payrollStats?.totalGross ?? 0}
              language={language}
            />
            <StatCard
              label={copy.statsCards.net}
              value={payrollStats?.totalNet ?? 0}
              language={language}
            />
            <StatCard
              label={copy.statsCards.taxes}
              value={payrollStats?.totalTax ?? 0}
              language={language}
            />
            <StatCard
              label={copy.statsCards.deductions}
              value={payrollStats?.totalDeductions ?? 0}
              language={language}
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            {batchesByTab.length === 0 ? (
              <p className="text-sm text-slate-500">{copy.emptyMessage}</p>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">{copy.monthLabel}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">{copy.statusDraft}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">{copy.gross}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">{copy.net}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">{copy.tax}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">{copy.deductions}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchesByTab.map((batch, index) => (
                    <tr key={batch.id} className={selectedBatch?.id === batch.id ? 'bg-blue-50/60' : undefined}>
                      <td className="px-4 py-3 font-semibold text-slate-700">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{batch.payrollMonth}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusClasses[batch.status] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {statusLabel(batch.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(batch.grossTotal ?? 0, language)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(batch.netTotal ?? 0, language)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatCurrency(batch.taxTotal ?? 0, language)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatCurrency(batch.deductionTotal ?? 0, language)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectBatch(batch)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {copy.viewDetails}
                          </button>
                          {canManage && batch.status === 'draft' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(batch, 'review')}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                              {copy.moveToReview}
                            </button>
                          ) : null}
                          {canManage && batch.status === 'review' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(batch, 'finalized')}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {copy.finalize}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {batchDetails ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {copy.batchTotals}: {batchDetails.payrollMonth}
              </h3>
              <p className="text-sm text-slate-500">
                {copy.created}:{' '}
                {batchDetails.createdAt
                  ? new Date(batchDetails.createdAt).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                {copy.exportCsv}
              </button>
              <button
                type="button"
                onClick={handleExportSpreadsheet}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {copy.exportXlsx}
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5" />
                {copy.exportPdf}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <StatCard label={copy.gross} value={batchDetails.grossTotal ?? 0} language={language} />
            <StatCard label={copy.tax} value={batchDetails.taxTotal ?? 0} language={language} />
            <StatCard label={copy.deductions} value={batchDetails.deductionTotal ?? 0} language={language} />
            <StatCard label={copy.net} value={batchDetails.netTotal ?? 0} language={language} />
          </div>
          <div className="mt-6">
            <h4 className="text-base font-semibold text-slate-900">{copy.itemsTitle}</h4>
            <p className="mt-1 text-xs text-slate-500">{detailCopy.clickHint}</p>
            {detailsLoading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : !batchDetails.items || batchDetails.items.length === 0 ? (
              <p className="text-sm text-slate-500 mt-3">{copy.noItems}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">Employee</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">{copy.gross}</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">{copy.tax}</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">{copy.deductions}</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">{copy.net}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchDetails.items.map((item) => {
                      const metadata = (item.metadata ?? {}) as Record<string, unknown>;
                      const rawName = metadata['userName'];
                      const displayName =
                        typeof rawName === 'string' && rawName.trim().length > 0
                          ? rawName
                          : `#${item.userId}`;
                      return (
                        <tr
                          key={item.id ?? `${item.userId}`}
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                        >
                          <td className="px-4 py-2 font-medium text-slate-800">{displayName}</td>
                          <td className="px-4 py-2">{formatCurrency(item.grossAmount, language)}</td>
                          <td className="px-4 py-2 text-slate-600">
                            {formatCurrency(item.taxAmount, language)}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {formatCurrency(item.deductionAmount, language)}
                          </td>
                          <td className="px-4 py-2 font-semibold text-slate-900">
                            {formatCurrency(item.netAmount, language)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {detailCopy.title(selectedMetadata.name || `#${selectedItem.userId}`)}
                </h3>
                <p className="text-sm text-slate-500">{detailCopy.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {detailCopy.close}
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{detailCopy.fields.base}</p>
                <p className="text-xl font-semibold text-slate-900">
                  {formatCurrency(selectedItem.baseSalary, language)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Gross</p>
                <p className="text-xl font-semibold text-emerald-800">
                  {formatCurrency(selectedItem.grossAmount, language)}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-blue-700">Net</p>
                <p className="text-xl font-semibold text-blue-800">
                  {formatCurrency(selectedItem.netAmount, language)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <DetailCard
                label={detailCopy.fields.lessons}
                value={formatCurrency(selectedItem.lessonBonus, language)}
                onClick={() => setLessonModalOpen(true)}
              />
              <DetailCard label={detailCopy.fields.catalog} value={formatCurrency(selectedItem.catalogBonus, language)} />
              <DetailCard
                label={`${detailCopy.fields.extra}${selectedFacts.extraMinutes !== null ? ` (${Math.round(selectedFacts.extraMinutes)} min)` : ''}`}
                value={formatCurrency(selectedItem.extraBonus, language)}
                onClick={() =>
                  selectedFacts.extraMinutes !== null || selectedExtras.length > 0
                    ? setExtraModalOpen(true)
                    : undefined
                }
              />
              <DetailCard label={detailCopy.fields.tax} value={formatCurrency(selectedItem.taxAmount, language)} />
              <DetailCard
                label={detailCopy.fields.deduction}
                value={formatCurrency(selectedItem.deductionAmount, language)}
              />
              <DetailCard label={detailCopy.fields.net} value={formatCurrency(selectedItem.netAmount, language)} highlighted />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{detailCopy.lessonSummary.title}</h4>
                  {selectedExtras.length > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      onClick={() => setExtraModalOpen(true)}
                    >
                      Details
                    </button>
                  ) : null}
                </div>
                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <dt>{detailCopy.lessonSummary.cambridge}</dt>
                    <dd className="font-semibold text-slate-900">{selectedItem.cambridgeLessons}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>{detailCopy.lessonSummary.georgian}</dt>
                    <dd className="font-semibold text-slate-900">{selectedItem.georgianLessons}</dd>
                  </div>
                  {selectedFacts.extraMinutes !== null ? (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <dt>Extra time</dt>
                      <dd className="font-semibold text-slate-800">
                        {Math.round(selectedFacts.extraMinutes)} min
                        {selectedFacts.extraRate !== null
                          ? ` · ${formatCurrency(selectedFacts.extraRate, language)}/h`
                          : ''}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{detailCopy.selectedBonuses}</h4>
                  {selectedMetadata.bonusIds.length > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      onClick={() => setBonusModalOpen(true)}
                    >
                      Details
                    </button>
                  ) : null}
                </div>
                {selectedMetadata.bonusIds.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">{detailCopy.noBonuses}</p>
                ) : (
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {selectedMetadata.bonusIds.slice(0, 3).map((bonusId) => (
                      <li key={bonusId} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                        <span>{bonusNameMap.get(bonusId) ?? `#${bonusId}`}</span>
                      </li>
                    ))}
                    {selectedMetadata.bonusIds.length > 3 ? (
                      <li className="px-3 py-1 text-xs text-slate-500">
                        +{selectedMetadata.bonusIds.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Taxes & deductions</h4>
                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                  {selectedFacts.taxRate !== null ? (
                    <div className="flex items-center justify-between">
                      <dt>Tax rate</dt>
                      <dd className="font-semibold text-slate-900">{selectedFacts.taxRate.toFixed(2)}%</dd>
                    </div>
                  ) : null}
                  {selectedFacts.deductionsNote ? (
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      {selectedFacts.deductionsNote}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No extra deductions noted.</p>
                  )}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Raw calculation data</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Full payload used for this salary so every lari is traceable.
                </p>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 text-[11px] text-slate-100">
{selectedFacts.metadataJson}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bonusModalOpen && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4" onClick={() => setBonusModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">{detailCopy.selectedBonuses}</h4>
              <button
                type="button"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setBonusModalOpen(false)}
              >
                {detailCopy.close}
              </button>
            </div>
            {selectedMetadata.bonusIds.length === 0 && selectedFacts.bonusBreakdown.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{detailCopy.noBonuses}</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {selectedFacts.bonusBreakdown.length > 0
                  ? selectedFacts.bonusBreakdown.map((entry, idx) => (
                      <li
                        key={`${entry.id ?? 'x'}-${idx}`}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span>{entry.name ?? bonusNameMap.get(entry.id ?? -1) ?? `#${entry.id ?? ''}`}</span>
                        {entry.amount !== undefined ? (
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(entry.amount, language)}
                          </span>
                        ) : null}
                      </li>
                    ))
                  : selectedMetadata.bonusIds.map((bonusId) => (
                      <li
                        key={bonusId}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span>{bonusNameMap.get(bonusId) ?? `#${bonusId}`}</span>
                      </li>
                    ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {extraModalOpen && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4" onClick={() => setExtraModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Extra hours</h4>
              <button
                type="button"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setExtraModalOpen(false)}
              >
                {detailCopy.close}
              </button>
            </div>
            {selectedExtras.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No extra hours recorded.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">From</th>
                      <th className="px-3 py-2 text-left">To</th>
                      <th className="px-3 py-2 text-left">Minutes</th>
                      <th className="px-3 py-2 text-left">Application</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedExtras.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{entry.date ?? '—'}</td>
                        <td className="px-3 py-2">{entry.start ?? '—'}</td>
                        <td className="px-3 py-2">{entry.end ?? '—'}</td>
                        <td className="px-3 py-2">{entry.minutes ?? '—'}</td>
                        <td className="px-3 py-2">{entry.applicationNumber ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {lessonModalOpen && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4" onClick={() => setLessonModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">{detailCopy.fields.lessons}</h4>
              <button
                type="button"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setLessonModalOpen(false)}
              >
                {detailCopy.close}
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{detailCopy.lessonSummary.cambridge}</span>
                <span className="font-semibold">
                  {selectedItem.cambridgeLessons} x {formatCurrency(selectedFacts.cambridgeRate ?? 0, language)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{detailCopy.lessonSummary.georgian}</span>
                <span className="font-semibold">
                  {selectedItem.georgianLessons} x {formatCurrency(selectedFacts.georgianRate ?? 0, language)}
                </span>
              </div>
              <div className="border-t pt-2 text-right text-xs text-slate-500">
                {detailCopy.lessonSummary.title}: {formatCurrency(selectedItem.lessonBonus, language)}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

type StatCardProps = {
  label: string;
  value: number;
  language: 'ka' | 'en';
};

const StatCard: React.FC<StatCardProps> = ({ label, value, language }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(value, language)}</p>
  </div>
);

type DetailCardProps = {
  label: string;
  value: string;
  highlighted?: boolean;
  onClick?: () => void;
};

const DetailCard: React.FC<DetailCardProps> = ({ label, value, highlighted = false, onClick }) => (
  <div
    className={`rounded-2xl border p-4 ${
      highlighted ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
    } ${onClick ? 'cursor-pointer transition hover:border-blue-200 hover:shadow-sm' : ''}`}
    onClick={onClick}
  >
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
  </div>
);
