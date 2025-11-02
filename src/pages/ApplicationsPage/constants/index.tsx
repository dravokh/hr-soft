import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  X
} from 'lucide-react';
import { ApplicationStatus, AuditLog } from '../../../types';

export const BUILT_IN_FIELD_KEYS = new Set([
  'reason',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'additional_comment'
]);

export const AUDIT_ACTION_LABELS: Record<
  AuditLog['action'],
  { ka: string; en: string }
> = {
  CREATE: {
    ka: 'განაცხადი შეიქმნა',
    en: 'Application created'
  },
  SUBMIT: {
    ka: 'გაგზავნილია დამტკიცებისთვის',
    en: 'Submitted for approval'
  },
  APPROVE: {
    ka: 'დამტკიცდა',
    en: 'Approved'
  },
  REJECT: {
    ka: 'დაუბრუნდა შესწორებისთვის',
    en: 'Returned for changes'
  },
  EDIT: {
    ka: 'ინფორმაცია განახლდა',
    en: 'Details updated'
  },
  RESEND: {
    ka: 'ხელახლა გადაიგზავნა დამტკიცებაზე',
    en: 'Resent to approvers'
  },
  CLOSE: {
    ka: 'განაცხადი დაიხურა',
    en: 'Application closed'
  },
  AUTO_APPROVE: {
    ka: 'ავტომატურად დამტკიცდა',
    en: 'Automatically approved'
  },
  EXPIRE_BOUNCE: {
    ka: 'დაუბრუნდა SLA-ს ვადის გასვლის გამო',
    en: 'Returned after SLA expiration'
  }
};

export const PRINT_COPY: Record<
  'ka' | 'en',
  {
    summaryTitle: string;
    requester: string;
    contact: string;
    status: string;
    created: string;
    fields: string;
    attachments: string;
    noAttachments: string;
  }
> = {
  ka: {
    summaryTitle: 'განაცხადის შეჯამება',
    requester: 'ავტორი',
    contact: 'კონტაქტი',
    status: 'სტატუსი',
    created: 'შექმნის დრო',
    fields: 'განაცხადის დეტალები',
    attachments: 'დანართები',
    noAttachments: 'დანართები არ არის'
  },
  en: {
    summaryTitle: 'Application summary',
    requester: 'Requester',
    contact: 'Contact',
    status: 'Status',
    created: 'Created at',
    fields: 'Application details',
    attachments: 'Attachments',
    noAttachments: 'No attachments'
  }
};

export const STATUS_META: Record<
  ApplicationStatus,
  { label: { ka: string; en: string }; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: { ka: 'დრაფტი', en: 'Draft' },
    color: 'bg-slate-200 text-slate-700',
    icon: <FileText className="w-4 h-4" />
  },
  PENDING: {
    label: { ka: 'მოლოდინში', en: 'Pending' },
    color: 'bg-amber-100 text-amber-700',
    icon: <Clock3 className="w-4 h-4" />
  },
  APPROVED: {
    label: { ka: 'დამტკიცებულია', en: 'Approved' },
    color: 'bg-emerald-100 text-emerald-700',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  REJECTED: {
    label: { ka: 'დაბრუნდა', en: 'Returned' },
    color: 'bg-rose-100 text-rose-600',
    icon: <AlertCircle className="w-4 h-4" />
  },
  CLOSED: {
    label: { ka: 'დახურული', en: 'Closed' },
    color: 'bg-slate-100 text-slate-600',
    icon: <X className="w-4 h-4" />
  }
};

export const FILTERABLE_STATUSES: ApplicationStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'];

export const COPY: Record<
  'ka' | 'en',
  {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filters: {
      heading: string;
      keywordLabel: string;
      creatorLabel: string;
      creatorPlaceholder: string;
      statusLabel: string;
      statusPlaceholder: string;
      startDateLabel: string;
      endDateLabel: string;
      lastThirtyDays: string;
      clear: string;
      apply: string;
    };
    create: string;
    tabs: { all: string; pending: string; sent: string; returned: string };
    table: { number: string; type: string; requester: string; status: string; updated: string; action: string; empty: string };
    modal: {
      details: string;
      requester: string;
      created: string;
      period: string;
      comment: string;
      attachments: string;
      history: string;
      showHistory: string;
      hideHistory: string;
      historyPrompt: string;
      approve: string;
      reject: string;
      resend: string;
      close: string;
      rejectPlaceholder: string;
      editTitle: string;
      update: string;
      cancelEdit: string;
      noPermission: string;
      actionSuccess: string;
      actionError: string;
    };
    createModal: {
      title: string;
      selectType: string;
      selectPlaceholder: string;
      selectPrompt: string;
      submit: string;
      submitting: string;
      cancel: string;
      commentLabel: string;
      attachmentLabel: string;
      attachmentHelp: string;
      uploadFromComputer: string;
      addLink: string;
      fileTooLarge: string;
      uploadError: string;
      validation: string;
      success: string;
    };
  }
> = {
  ka: {
    title: 'განაცხადები',
    subtitle: 'დააკვირდით დამტკიცების პროცესს, გააზიარეთ კომენტარები და მართეთ ავტომატური შეტყობინებები.',
    searchPlaceholder: 'ძიება ნომრის, ავტორის, სტატუსის ან თარიღის მიხედვით…',
    filters: {
      heading: 'ძიება და ფილტრები',
      keywordLabel: 'საკვანძო სიტყვა',
      creatorLabel: 'ავტორი',
      creatorPlaceholder: 'ყველა ავტორი',
      statusLabel: 'სტატუსი',
      statusPlaceholder: 'ყველა სტატუსი',
      startDateLabel: 'საწყისი თარიღი',
      endDateLabel: 'საბოლოო თარიღი',
      lastThirtyDays: 'ბოლო 30 დღე',
      clear: 'ფილტრების გასუფთავება',
      apply: 'ძიება'
    },
    create: '+ ახალი განაცხადი',
    tabs: { all: 'ყველა', pending: 'მოლოდინში', sent: 'ჩემი გაგზავნილები', returned: 'უკან დაბრუნებული' },
    table: {
      number: '#',
      type: 'ტიპი',
      requester: 'ავტორი',
      status: 'სტატუსი',
      updated: 'განახლდა',
      action: 'დეტალები',
      empty: 'ჯერ არცერთი განაცხადი არ გაქვთ.'
    },
    modal: {
      details: 'დეტალები',
      requester: 'ავტორი',
      created: 'შექმნის დრო',
      period: 'პერიოდი',
      comment: 'კომენტარი',
      attachments: 'დანართები',
      history: 'ქმედებები',
      showHistory: 'ქმედებების ნახვა',
      hideHistory: 'ქმედებების დამალვა',
      historyPrompt: 'დააჭირეთ ღილაკს, თუ აქტივობის ნახვა გსურთ.',
      approve: 'დამტკიცება',
      reject: 'დაბრუნება',
      resend: 'რედაქტირება და ხელახლა გაგზავნა',
      close: 'დახურვა',
      rejectPlaceholder: 'დაბრუნების მიზეზი…',
      editTitle: 'განაახლეთ ველები',
      update: 'განახლება',
      cancelEdit: 'გაუქმება',
      noPermission: 'თქვენ არ გაქვთ ამ ქმედების შესრულების უფლება.',
      actionSuccess: 'ქმედება წარმატებით შესრულდა.',
      actionError: 'დაფიქსირდა შეცდომა, სცადეთ თავიდან.'
    },
    createModal: {
      title: 'ახალი განაცხადის შექმნა',
      selectType: 'აირჩიეთ განაცხადის ტიპი',
      selectPlaceholder: 'აირჩიეთ ტიპი…',
      selectPrompt: 'ტიპის არჩევის შემდეგ გამოჩნდება მისთვის კონფიგურირებული ველები.',
      submit: 'გაგზავნა',
      submitting: ' იგზავნება…',
      cancel: 'დახურვა',
      commentLabel: 'დამატებითი კომენტარი',
      attachmentLabel: 'დანართები',
      attachmentHelp: 'დაამატეთ ბმული ან ატვირთეთ ფაილი (50MB-მდე).',
      uploadFromComputer: 'ფაილის ატვირთვა კომპიუტერიდან',
      addLink: 'ბმულის დამატება',
      fileTooLarge: 'ფაილი ძალიან დიდია. მაქსიმალური ზომა {size}MB-ია.',
      uploadError: 'ფაილის ატვირთვა ვერ მოხერხდა. სცადეთ თავიდან.',
      validation: 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი.',
      success: 'განაცხადი წარმატებით გაიგზავნა.'
    }
  },
  en: {
    title: 'Applications',
    subtitle: 'Track approval workflows, share comments, and manage automated notifications.',
    searchPlaceholder: 'Search by number, requester, status, or date…',
    filters: {
      heading: 'Search & filters',
      keywordLabel: 'Keyword',
      creatorLabel: 'Creator',
      creatorPlaceholder: 'All creators',
      statusLabel: 'Status',
      statusPlaceholder: 'All statuses',
      startDateLabel: 'Start date',
      endDateLabel: 'End date',
      lastThirtyDays: 'Last 30 days',
      clear: 'Clear filters',
      apply: 'Search'
    },
    create: '+ New application',
    tabs: { all: 'All', pending: 'Pending', sent: 'Sent', returned: 'Returned' },
    table: {
      number: '#',
      type: 'Type',
      requester: 'Requester',
      status: 'Status',
      updated: 'Updated',
      action: 'View',
      empty: 'You have no applications yet.'
    },
    modal: {
      details: 'Details',
      requester: 'Requester',
      created: 'Created at',
      period: 'Period',
      comment: 'Comment',
      attachments: 'Attachments',
      history: 'Activity',
      showHistory: 'Show activity',
      hideHistory: 'Hide activity',
      historyPrompt: 'Use the button when you need to review the activity log.',
      approve: 'Approve',
      reject: 'Return',
      resend: 'Edit & resend',
      close: 'Close',
      rejectPlaceholder: 'Provide rejection reason…',
      editTitle: 'Update fields',
      update: 'Save changes',
      cancelEdit: 'Cancel',
      noPermission: 'You do not have permission for this action.',
      actionSuccess: 'Action completed successfully.',
      actionError: 'Something went wrong. Please try again.'
    },
    createModal: {
      title: 'Create a new application',
      selectType: 'Choose application type',
      selectPlaceholder: 'Select a type…',
      selectPrompt: 'Pick an application type to load the fields you configured for it.',
      submit: 'Submit',
      submitting: 'Submitting…',
      cancel: 'Cancel',
      commentLabel: 'Additional comment',
      attachmentLabel: 'Attachments',
      attachmentHelp: 'Attach a link or upload a file (up to 50MB).',
      uploadFromComputer: 'Upload from computer',
      addLink: 'Add link manually',
      fileTooLarge: 'File is too large. Maximum size is {size}MB.',
      uploadError: 'Unable to upload the file. Please try again.',
      validation: 'Please complete every required field.',
      success: 'Application submitted successfully.'
    }
  }
};
