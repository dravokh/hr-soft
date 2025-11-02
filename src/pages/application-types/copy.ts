import type { ApplicationTypeCapabilities, ApplicationStepSLA } from './types';

export interface ApplicationTypesCopy {
  title: string;
  subtitle: string;
  create: string;
  edit: string;
  view: string;
  empty: string;
  basicInformation: string;
  nameKa: string;
  descriptionKa: string;
  fieldSettings: string;
  toggles: {
    requiresDateRange: string;
    requiresTimeRange: string;
    hasCommentField: string;
    allowsAttachments: string;
  };
  requiredLabel: string;
  allowedRoles: string;
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
    nameKa: 'დასახელება',
    descriptionKa: 'აღწერა',
    fieldSettings: 'ველების კონფიგურაცია',
    toggles: {
      requiresDateRange: 'კალენდრის დიაპაზონი',
      requiresTimeRange: 'დროის დიაპაზონი',
      hasCommentField: 'დამატებითი კომენტარი',
      allowsAttachments: 'ფაილის ატვირთვა (50მბ-მდე)'
    },
    requiredLabel: 'სავალდებულო',
    allowedRoles: 'ვინ შეუძლია განაცხადის შექმნა',
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
    nameKa: 'Name',
    descriptionKa: 'Description',
    fieldSettings: 'Field configuration',
    toggles: {
      requiresDateRange: 'Calendar range',
      requiresTimeRange: 'Time range',
      hasCommentField: 'Comment box',
      allowsAttachments: 'Upload file from computer (up to 50MB)'
    },
    requiredLabel: 'Required',
    allowedRoles: 'Who can submit this request',
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
    expireActions: {
      AUTO_APPROVE: 'Auto approve',
      BOUNCE_BACK: 'Return to requester'
    }
  }
};
