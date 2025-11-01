import type { ApplicationTypeCapabilities, ApplicationStepSLA } from './types';
import type { CustomFieldType } from './types';

export interface ApplicationTypesCopy {
  title: string;
  subtitle: string;
  create: string;
  edit: string;
  view: string;
  empty: string;
  basicInformation: string;
  nameKa: string;
  nameEn: string;
  descriptionKa: string;
  descriptionEn: string;
  iconLabel: string;
  colorLabel: string;
  colorHint: string;
  fieldSettings: string;
  reasonLabel: string;
  commentLabel: string;
  toggles: {
    requiresDateRange: string;
    requiresTimeRange: string;
    hasCommentField: string;
    allowsAttachments: string;
  };
  allowedRoles: string;
  customFieldTitle: string;
  addCustomField: string;
  fieldKey: string;
  fieldLabelKa: string;
  fieldLabelEn: string;
  fieldType: string;
  fieldRequired: string;
  flowTitle: string;
  addStep: string;
  slaTitle: string;
  hours: string;
  expiryAction: string;
  actions: { save: string; saving: string; cancel: string; delete: string };
  successCreated: string;
  successUpdated: string;
  successDeleted: string;
  noPermission: string;
  validationError: string;
  selectRole: string;
  customFieldTypes: Record<CustomFieldType, string>;
  expireActions: Record<ApplicationStepSLA['onExpire'], string>;
}

export const DEFAULT_REASON_PLACEHOLDER = {
  ka: 'მოკლედ აღწერეთ განაცხადის მიზეზი…',
  en: 'Describe why you are submitting this request…'
};

export const DEFAULT_COMMENT_PLACEHOLDER = {
  ka: 'შეიტანეთ დამატებითი ინფორმაცია საჭიროების შემთხვევაში…',
  en: 'Add context for reviewers if needed…'
};

export const COPY: Record<'ka' | 'en', ApplicationTypesCopy> = {
  ka: {
    title: 'განაცხადების ტიპები',
    subtitle: 'მართეთ დამტკიცების ნაკადები, სტანდარტული ველები და SLA წესები თითოეული განაცხადისთვის.',
    create: 'ახალი ტიპის შექმნა',
    edit: 'ტიპის რედაქტირება',
    view: 'ტიპის დეტალები',
    empty: 'ჯერ არცერთი განაცხადის ტიპი არ არის შექმნილი.',
    basicInformation: 'ძირითადი ინფორმაცია',
    nameKa: 'დასახელება (ქართ.)',
    nameEn: 'დასახელება (ინგლ.)',
    descriptionKa: 'აღწერა (ქართ.)',
    descriptionEn: 'აღწერა (ინგლ.)',
    iconLabel: 'Icon (Lucide)',
    colorLabel: 'ფერი (Tailwind კლასი)',
    colorHint: 'მაგ: bg-sky-500, bg-emerald-500',
    fieldSettings: 'ველების კონფიგურაცია',
    reasonLabel: 'მიზნის ველის სათაური',
    commentLabel: 'კომენტარის ველის სათაური',
    toggles: {
      requiresDateRange: 'საჭიროა კალენდრის დიაპაზონი',
      requiresTimeRange: 'საჭიროა დროის დიაპაზონი',
      hasCommentField: 'დამატებითი კომენტარი',
      allowsAttachments: 'ფაილების ატვირთვა დაშვებულია'
    },
    allowedRoles: 'ვინ შეუძლია განაცხადის შექმნა',
    customFieldTitle: 'დამატებითი ველები',
    addCustomField: 'ველი',
    fieldKey: 'Key',
    fieldLabelKa: 'სათაური (ქართ.)',
    fieldLabelEn: 'სათაური (ინგლ.)',
    fieldType: 'ტიპი',
    fieldRequired: 'სავალდებულო',
    flowTitle: 'დამტკიცების მიმდევრობა',
    addStep: 'ნაბიჯის დამატება',
    slaTitle: 'SLA თითო ნაბიჯზე',
    hours: 'საათი',
    expiryAction: 'ვადის ამოწურვისას',
    actions: {
      save: 'შენახვა',
      saving: 'ინახება…',
      cancel: 'გაუქმება',
      delete: 'ტიპის წაშლა'
    },
    successCreated: 'ტიპი წარმატებით შეიქმნა.',
    successUpdated: 'ცვლილებები შენახულია.',
    successDeleted: 'ტიპი წაიშალა.',
    noPermission: 'თქვენ არ გაქვთ განაცხადების ტიპების მართვის უფლება.',
    validationError: 'გთხოვთ შეავსოთ სავალდებულო ველები და მიუთითოთ მინიმუმ ერთი ნაბიჯი.',
    selectRole: 'აირჩიეთ როლი…',
    customFieldTypes: {
      text: 'ტექსტი',
      number: 'რიცხვი',
      textarea: 'ტექსტური ბლოკი'
    },
    expireActions: {
      AUTO_APPROVE: 'ავტომატური დამტკიცება',
      BOUNCE_BACK: 'დაბრუნება ავტორზე'
    }
  },
  en: {
    title: 'Application types',
    subtitle: 'Configure approval flows, standard fields, and SLA rules for each request.',
    create: 'Create type',
    edit: 'Edit type',
    view: 'Type overview',
    empty: 'No application types have been created yet.',
    basicInformation: 'Basic information',
    nameKa: 'Name (Georgian)',
    nameEn: 'Name (English)',
    descriptionKa: 'Description (Georgian)',
    descriptionEn: 'Description (English)',
    iconLabel: 'Icon (Lucide)',
    colorLabel: 'Color (Tailwind class)',
    colorHint: 'e.g. bg-sky-500, bg-emerald-500',
    fieldSettings: 'Field configuration',
    reasonLabel: 'Purpose field label',
    commentLabel: 'Comment field label',
    toggles: {
      requiresDateRange: 'Require calendar range',
      requiresTimeRange: 'Require time range',
      hasCommentField: 'Include comment box',
      allowsAttachments: 'Allow attachments'
    },
    allowedRoles: 'Who can submit this request',
    customFieldTitle: 'Additional fields',
    addCustomField: 'Add field',
    fieldKey: 'Field key',
    fieldLabelKa: 'Label (Georgian)',
    fieldLabelEn: 'Label (English)',
    fieldType: 'Type',
    fieldRequired: 'Required',
    flowTitle: 'Approval flow',
    addStep: 'Add step',
    slaTitle: 'SLA per step',
    hours: 'Hours',
    expiryAction: 'When overdue',
    actions: {
      save: 'Save changes',
      saving: 'Saving…',
      cancel: 'Cancel',
      delete: 'Delete type'
    },
    successCreated: 'Type created successfully.',
    successUpdated: 'Changes saved successfully.',
    successDeleted: 'Type removed successfully.',
    noPermission: 'You do not have permission to manage request types.',
    validationError: 'Please fill in required fields and configure at least one approval step.',
    selectRole: 'Select role…',
    customFieldTypes: {
      text: 'Text',
      number: 'Number',
      textarea: 'Textarea'
    },
    expireActions: {
      AUTO_APPROVE: 'Auto approve',
      BOUNCE_BACK: 'Return to requester'
    }
  }
};
