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
  usage: {
    title: string;
    description: string;
    vacation: string;
    grace: string;
    penalty: string;
    extra: string;
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
  ka: 'მოკლედ აღწერეთ განაცხადის მიზანი…',
  en: 'Describe why you are submitting this request…'
};

export const DEFAULT_COMMENT_PLACEHOLDER = {
  ka: 'დაამატეთ დამატებითი განმარტება საჭიროების შემთხვევაში…',
  en: 'Add extra context for reviewers if needed…'
};

export const COPY: Record<'ka' | 'en', ApplicationTypesCopy> = {
  ka: {
    title: 'განაცხადების ტიპები',
    subtitle:
      'დააგეგმე დამტკიცებების ჯაჭვები, სტანდარტული ველები და SLA წესები, რათა გუნდის განაცხადები ერთიანი პროცედურით დამუშავდეს.',
    create: 'ახალი ტიპი',
    edit: 'ტიპის რედაქტირება',
    view: 'ტიპის ნახვა',
    empty: 'ჯერ არცერთი განაცხადის ტიპი არ გაქვთ შექმნილი.',
    basicInformation: 'ძირითადი ინფორმაცია',
    nameKa: 'დასახელება',
    descriptionKa: 'აღწერა',
    fieldSettings: 'ველების კონფიგურაცია',
    toggles: {
      requiresDateRange: 'თარიღების დიაპაზონი',
      requiresTimeRange: 'დროის დიაპაზონი',
      hasCommentField: 'კომენტარის ველი',
      allowsAttachments: 'ფაილების ატვირთვა (მდე 50MB)'
    },
    usage: {
      title: 'სალაროს/ბალანსის კალკულატორები',
      description: 'აირჩიე რომელი ბალანსები უნდა გამოაკლდეს ამ ტიპის განაცხადის გაგზავნისას.',
      vacation: 'შვებულების კალკულატორი',
      grace: 'დაგვიანების საათების კონტროლი',
      penalty: 'დამატებითი საათების ჯარიმა',
      extra: 'Extra bonus calculator'
    },
    requiredLabel: 'სავალდებულო',
    allowedRoles: 'ვის შეუძლია ამ განაცხადის შევსება',
    flowTitle: 'დამტკიცების ჯაჭვი',
    addStep: 'ნაბიჯის დამატება',
    slaTitle: 'SLA თითოეულ ნაბიჯზე',
    hours: 'საათი',
    expiryAction: 'ვადაგადაცილებისას',
    actions: {
      save: 'ცვლილებების შენახვა',
      saving: 'ინახება…',
      cancel: 'გაუქმება',
      delete: 'ტიპის წაშლა'
    },
    successCreated: 'ტიპი წარმატებით შეიქმნა.',
    successUpdated: 'ცვლილებები წარმატებით შეინახა.',
    successDeleted: 'ტიპი წარმატებით წაიშალა.',
    noPermission: 'თქვენ არ გაქვთ განაცხადების ტიპების მართვის უფლება.',
    validationError: 'შეავსეთ სავალდებულო ველები და მიუთითეთ მინიმუმ ერთი დამტკიცების ეტაპი.',
    selectRole: 'არჩევა…',
    expireActions: {
      AUTO_APPROVE: 'ავტომატური დადასტურება',
      BOUNCE_BACK: 'დაბრუნება ინიციატორთან'
    }
  },
  en: {
    title: 'Application types',
    subtitle:
      'Set up standard fields, approval flows, and SLA rules so every request follows the same playbook.',
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
      allowsAttachments: 'Upload files (up to 50MB)'
    },
    usage: {
      title: 'Usage tracking',
      description: 'Pick which employee balances this request type should decrement on submission.',
      vacation: 'Vacation day calculator',
      grace: 'Grace period tracker',
      penalty: 'Overtime penalty tracker',
      extra: 'Extra bonus (overtime)'
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
    validationError: 'Please fill required fields and configure at least one approval step.',
    selectRole: 'Select role…',
    expireActions: {
      AUTO_APPROVE: 'Auto approve',
      BOUNCE_BACK: 'Return to requester'
    }
  }
};
