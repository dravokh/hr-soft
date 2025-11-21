/**
 * Application-specific constants including status metadata,
 * translations, and field definitions
 */

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  X
} from 'lucide-react';
import { ApplicationStatus } from '../types';

/**
 * Built-in field keys that are managed by the system
 */
export const BUILT_IN_FIELD_KEYS = new Set([
  'reason',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'additional_comment'
]);

/**
 * Status metadata including labels, colors, and icons
 */
export const STATUS_META: Record<
  ApplicationStatus,
  { label: { ka: string; en: string }; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: { ka: 'დრაფტი', en: 'Draft' },
    color: 'bg-slate-200 text-slate-700',
    icon: React.createElement(FileText, { className: 'w-4 h-4' })
  },
  PENDING: {
    label: { ka: 'მოლოდინში', en: 'Pending' },
    color: 'bg-amber-100 text-amber-700',
    icon: React.createElement(Clock3, { className: 'w-4 h-4' })
  },
  APPROVED: {
    label: { ka: 'დადასტურებულია', en: 'Approved' },
    color: 'bg-emerald-100 text-emerald-700',
    icon: React.createElement(CheckCircle2, { className: 'w-4 h-4' })
  },
  REJECTED: {
    label: { ka: 'დაბრუნდა', en: 'Returned' },
    color: 'bg-rose-100 text-rose-600',
    icon: React.createElement(AlertCircle, { className: 'w-4 h-4' })
  },
  CLOSED: {
    label: { ka: 'დახურული', en: 'Closed' },
    color: 'bg-slate-100 text-slate-600',
    icon: React.createElement(X, { className: 'w-4 h-4' })
  }
};

/**
 * Translations for the Applications page
 */
export const APPLICATIONS_COPY: Record<
  'ka' | 'en',
  {
    title: string;
    subtitle: string;
    create: string;
    tabs: { all: string; pending: string; sent: string; returned: string };
    table: {
      number: string;
      type: string;
      requester: string;
      status: string;
      updated: string;
      action: string;
      empty: string;
    };
    modal: {
      details: string;
      requester: string;
      created: string;
      period: string;
      comment: string;
      attachments: string;
      history: string;
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
      formTitle: string;
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
    subtitle: 'დააკვირდით დადასტურების პროცესს, გააზიარეთ კომენტარები და მართეთ ავტომატური შეტყობინებები.',
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
      approve: 'დადასტურება',
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
      formTitle: 'მთავარი ინფორმაცია',
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
      formTitle: 'Primary information',
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
